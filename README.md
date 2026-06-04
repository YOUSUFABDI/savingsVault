# SavingsVault

A full-stack DeFi savings application built on Ethereum. Users can deposit ETH, choose a lock period, earn interest rewards, and withdraw — all powered by a smart contract on the Sepolia testnet.

> Built as a final project for the [Alchemy University Ethereum Bootcamp](https://university.alchemy.com/home).

---

## Overview

SavingsVault lets users:

- **Deposit ETH** with a chosen lock period (7, 14, or 30 days)
- **Earn interest** automatically (3%, 7%, or 15% depending on lock)
- **Withdraw** after the lock expires to receive principal + reward
- **Early withdraw** before the lock ends (with a 10% penalty)
- **Track all deposits** in a live dashboard with countdown timers

---

## Tech Stack

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

# Credits

SavingsVault is built and maintained solely by YUSUF. Special thanks to the developers of the libraries and frameworks used in this project.
