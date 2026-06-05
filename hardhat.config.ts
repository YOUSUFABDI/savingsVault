import "@nomicfoundation/hardhat-ethers"
import "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import { configVariable } from "hardhat/config"

const config = {
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  testing: {
    testRunner: "mocha",
    testFiles: ["test/**/*.test.ts"],
  },
  networks: {
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
}

export default config
