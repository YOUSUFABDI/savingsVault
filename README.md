# 🏦 SavingsVault

A full-stack DeFi savings application built on Ethereum. Users can deposit ETH, choose a lock period, earn interest rewards, and withdraw — all powered by a smart contract on the Sepolia testnet.

> Built as a final project for the [Alchemy University Ethereum Bootcamp](https://university.alchemy.com/course/ethereum/) Just for learning purpose.

---

## ⚠️ Disclaimer

**This project was built for educational purposes only** as part of the Alchemy University Ethereum Bootcamp. It is a learning exercise to demonstrate understanding of Solidity smart contracts, Hardhat, and React-based Web3 frontends.

The interest/reward mechanism in this contract involves fixed guaranteed returns which may constitute **Riba** under Islamic finance principles. The author does not endorse deploying this contract with real funds, and is not responsible for any use of this code beyond its intended educational purpose. Anyone who chooses to deploy or modify this contract for real financial use does so entirely at their own responsibility.

> _"And Allah has permitted trade and forbidden interest."_ — Quran 2:275

---

## 📸 Overview

SavingsVault lets users:

- **Deposit ETH** with a chosen lock period (7, 14, or 30 days)
- **Earn interest** automatically (3%, 7%, or 15% depending on lock)
- **Withdraw** after the lock expires to receive principal + reward
- **Early withdraw** before the lock ends (with a 10% penalty)
- **Track all deposits** in a live dashboard with countdown timers

---

## 🛠 Tech Stack

| Layer              | Technology                    |
| ------------------ | ----------------------------- |
| Smart Contract     | Solidity `^0.8.28`            |
| Contract Dev       | Hardhat v3 + Hardhat Ignition |
| Blockchain         | Ethereum Sepolia Testnet      |
| RPC Provider       | Alchemy                       |
| Frontend           | React + TypeScript + Vite     |
| Blockchain Library | ethers.js v6                  |
| Wallet             | MetaMask                      |
| Styling            | Tailwind CSS v4               |

---

## 📁 Project Structure

```
savings-vault/
├── contracts/
│   └── SavingsVault.sol       # Smart contract
├── ignition/
│   └── modules/
│       └── SavingsVault.ts    # Hardhat Ignition deploy module
├── scripts/
│   └── fundVault.ts           # Script to fund vault with ETH
├── test/
│   └── SavingsVault.test.ts   # Contract unit tests
├── hardhat.config.ts          # Hardhat configuration
├── frontend/
│   └── src/
│       ├── abi.ts             # Contract ABI + address
│       ├── constants.ts       # Chain ID, RPC URL, lock options
│       ├── contract.ts        # ethers.js contract functions
│       ├── App.tsx            # Root component
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── VaultStats.tsx
│       │   ├── DepositForm.tsx
│       │   ├── DepositsDashboard.tsx
│       │   └── Countdown.tsx
│       ├── hooks/
│       │   └── useWallet.ts   # MetaMask wallet hook
│       └── utils/
│           └── format.ts      # ETH formatting helpers
└── .env.example               # Environment variable template
```

---

## 📜 Smart Contract

**Deployed on Sepolia:**

```
0xB73be23657e4559bD696A387610a2BC8B64Cf9c1
```

[View on Sepolia Etherscan →](https://sepolia.etherscan.io/address/0xB73be23657e4559bD696A387610a2BC8B64Cf9c1)

### Lock Periods

| Lock Period | Interest Rate |
| ----------- | ------------- |
| 7 days      | 3%            |
| 14 days     | 7%            |
| 30 days     | 15%           |

### Key Functions

```solidity
// Deposit ETH with a lock period
function deposit(uint256 lockDuration) external payable

// Withdraw after lock expires (principal + reward)
function withdraw(uint256 depositIndex) external

// Withdraw early (principal - 10% penalty)
function earlyWithdraw(uint256 depositIndex) external

// View all deposits for a user
function getDeposits(address user) external view returns (Deposit[])

// View vault's total ETH balance
function vaultBalance() external view returns (uint256)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MetaMask](https://metamask.io/) browser extension
- [Alchemy](https://dashboard.alchemy.com/) account (free)
- Sepolia test ETH — get some free at [sepoliafaucet.com](https://sepoliafaucet.com)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/savings-vault.git
cd savings-vault
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key_here
```

> ⚠️ **Never commit your `.env` file to GitHub.**

### 4. Compile & test

```bash
npx hardhat compile
npx hardhat test
```

### 5. Deploy to Sepolia

```bash
npx hardhat ignition deploy ./ignition/modules/SavingsVault.ts --network sepolia
```

### 6. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

### 7. Run the frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 💡 How It Works

```
User connects MetaMask (Sepolia network)
        │
        ▼
Deposit ETH → choose lock period (7 / 14 / 30 days)
        │
        ▼
ETH is locked in the smart contract
        │
        ├── Lock expires → Withdraw principal + interest ✅
        │
        └── Early exit → Withdraw principal - 10% penalty ⚠️
```

---

## 🔒 Security Notes

- Private keys are stored in `.env` and never committed to version control
- The contract owner can only collect penalty fees — they cannot access user deposits
- The contract has no upgrade mechanism — rules are permanent once deployed

---

## 🏅 Credits

SavingsVault is built and maintained solely by **Yusuf**. Special thanks to the developers of the libraries and frameworks used in this project.

---

## 📄 License

MIT
