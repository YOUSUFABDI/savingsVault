// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SavingsVault
 * @notice A DeFi savings vault where users deposit ETH, choose a lock period,
 * earn interest rewards, and can emergency-withdraw with a penalty.
 */
contract SavingsVault {

    // ─────────────────────────────────────────────
    //  CONSTANTS
    // ─────────────────────────────────────────────

    uint256 public constant LOCK_7_DAYS  = 7  days;
    uint256 public constant LOCK_14_DAYS = 14 days;
    uint256 public constant LOCK_30_DAYS = 30 days;

    // Interest rates (basis points, 1% = 100)
    uint256 public constant RATE_7_DAYS  = 300;  // 3%
    uint256 public constant RATE_14_DAYS = 700;  // 7%
    uint256 public constant RATE_30_DAYS = 1500; // 15%

    // Early withdrawal penalty (basis points)
    uint256 public constant EARLY_PENALTY = 1000; // 10%

    // Basis points denominator
    uint256 private constant BPS = 10_000;

    // ─────────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────────

    address public owner;
    uint256 public totalDeposits;
    uint256 public collectedPenalties;

    struct Deposit {
        uint256 amount;         // ETH deposited (wei)
        uint256 depositedAt;    // timestamp
        uint256 lockDuration;   // seconds
        uint256 interestRate;   // basis points
        bool    withdrawn;      // already claimed?
    }

    // user => list of deposits (supports multiple deposits per user)
    mapping(address => Deposit[]) public deposits;

    // ─────────────────────────────────────────────
    //  EVENTS
    // ─────────────────────────────────────────────

    event Deposited(address indexed user, uint256 amount, uint256 lockDuration, uint256 depositIndex);
    event Withdrawn(address indexed user, uint256 principal, uint256 reward, uint256 depositIndex);
    event EarlyWithdrawn(address indexed user, uint256 principal, uint256 penalty, uint256 depositIndex);
    event PenaltiesWithdrawn(address indexed owner, uint256 amount);
    event VaultFunded(address indexed funder, uint256 amount);

    // ─────────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─────────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────────

    constructor() payable {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────
    //  CORE FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Deposit ETH into the vault with a chosen lock period.
     * @param lockDuration Must be LOCK_7_DAYS, LOCK_14_DAYS, or LOCK_30_DAYS.
     */
    function deposit(uint256 lockDuration) external payable {
        require(msg.value > 0, "Must deposit ETH");
        require(
            lockDuration == LOCK_7_DAYS ||
            lockDuration == LOCK_14_DAYS ||
            lockDuration == LOCK_30_DAYS,
            "Invalid lock duration"
        );

        uint256 rate = _getRate(lockDuration);

        deposits[msg.sender].push(Deposit({
            amount:       msg.value,
            depositedAt:  block.timestamp,
            lockDuration: lockDuration,
            interestRate: rate,
            withdrawn:    false
        }));

        totalDeposits += msg.value;

        uint256 index = deposits[msg.sender].length - 1;
        emit Deposited(msg.sender, msg.value, lockDuration, index);
    }

    /**
     * @notice Withdraw after lock period has passed — receives principal + reward.
     * @param depositIndex Index of the deposit to withdraw.
     */
    function withdraw(uint256 depositIndex) external {
        Deposit storage dep = _getActiveDeposit(msg.sender, depositIndex);

        require(
            block.timestamp >= dep.depositedAt + dep.lockDuration,
            "Still locked"
        );

        uint256 reward    = _calculateReward(dep.amount, dep.interestRate);
        uint256 payout    = dep.amount + reward;

        dep.withdrawn  = true;
        totalDeposits -= dep.amount;

        // FIXED: Replaced '—' with '-'
        require(address(this).balance >= payout, "Vault underfunded - contact owner");

        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "Transfer failed");

        emit Withdrawn(msg.sender, dep.amount, reward, depositIndex);
    }

    /**
     * @notice Emergency withdraw before lock ends — loses 10% as penalty.
     * @param depositIndex Index of the deposit to withdraw early.
     */
    function earlyWithdraw(uint256 depositIndex) external {
        Deposit storage dep = _getActiveDeposit(msg.sender, depositIndex);

        // FIXED: Replaced '—' with '-'
        require(
            block.timestamp < dep.depositedAt + dep.lockDuration,
            "Lock already expired - use withdraw()"
        );

        uint256 penalty = (dep.amount * EARLY_PENALTY) / BPS;
        uint256 payout  = dep.amount - penalty;

        dep.withdrawn      = true;
        totalDeposits     -= dep.amount;
        collectedPenalties += penalty;

        (bool ok, ) = msg.sender.call{value: payout}("");
        require(ok, "Transfer failed");

        emit EarlyWithdrawn(msg.sender, dep.amount, penalty, depositIndex);
    }

    // ─────────────────────────────────────────────
    //  OWNER FUNCTIONS
    // ─────────────────────────────────────────────

    /**
     * @notice Owner funds the vault so it can pay out rewards.
     */
    function fundVault() external payable onlyOwner {
        emit VaultFunded(msg.sender, msg.value);
    }

    /**
     * @notice Owner withdraws accumulated penalty fees.
     */
    function withdrawPenalties() external onlyOwner {
        uint256 amount = collectedPenalties;
        require(amount > 0, "No penalties to withdraw");
        collectedPenalties = 0;
        (bool ok, ) = owner.call{value: amount}("");
        require(ok, "Transfer failed");
        emit PenaltiesWithdrawn(owner, amount);
    }

    // ─────────────────────────────────────────────
    //  VIEW FUNCTIONS
    // ─────────────────────────────────────────────

    /// @notice Returns all deposits for a user.
    function getDeposits(address user) external view returns (Deposit[] memory) {
        return deposits[user];
    }

    /// @notice Returns the number of deposits for a user.
    function getDepositCount(address user) external view returns (uint256) {
        return deposits[user].length;
    }

    /// @notice Returns the unlock timestamp for a specific deposit.
    function getUnlockTime(address user, uint256 depositIndex) external view returns (uint256) {
        Deposit storage dep = deposits[user][depositIndex];
        return dep.depositedAt + dep.lockDuration;
    }

    /// @notice Calculates expected reward for a deposit at maturity.
    function getExpectedReward(address user, uint256 depositIndex) external view returns (uint256) {
        Deposit storage dep = deposits[user][depositIndex];
        return _calculateReward(dep.amount, dep.interestRate);
    }

    /// @notice Returns the vault's current ETH balance.
    function vaultBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ─────────────────────────────────────────────
    //  INTERNAL HELPERS
    // ─────────────────────────────────────────────

    function _getRate(uint256 lockDuration) internal pure returns (uint256) {
        if (lockDuration == LOCK_7_DAYS)  return RATE_7_DAYS;
        if (lockDuration == LOCK_14_DAYS) return RATE_14_DAYS;
        return RATE_30_DAYS;
    }

    function _calculateReward(uint256 amount, uint256 rateBps) internal pure returns (uint256) {
        return (amount * rateBps) / BPS;
    }

    function _getActiveDeposit(address user, uint256 index) internal view returns (Deposit storage) {
        require(index < deposits[user].length, "Invalid deposit index");
        Deposit storage dep = deposits[user][index];
        require(!dep.withdrawn, "Already withdrawn");
        return dep;
    }

    // ─────────────────────────────────────────────
    //  FALLBACK — accept direct ETH (for funding)
    // ─────────────────────────────────────────────

    receive() external payable {}
}