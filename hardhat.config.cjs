// hardhat.config.cjs

// Load plugins using require()
require("@nomicfoundation/hardhat-toolbox"); 
// Any other required plugins

// Define networks object
const networks = {
    hardhat: {},
};

// Only define the Sepolia network if the environment variables are set.
if (process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_PRIVATE_KEY) {
    networks.sepolia = {
        url: process.env.SEPOLIA_RPC_URL,
        accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    };
}

// Define the configuration object
const config = {
    // 1. ADD THE PATHS BLOCK TO IGNORE FOUNDRY TESTS (.t.sol)
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
        ignore: ["/*.t.sol"], 
    },

    // 2. CORRECTED Solidity Configuration (using compilers array)
    solidity: {
        compilers: [
            { // Standard
                version: "0.8.28",
                settings: {
                    optimizer: {
                        enabled: false,
                    },
                },
            },
            { // Optimized
                version: "0.8.28",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    
    // 3. Network Configuration
    networks: networks, 
    
    // 4. Typechain Configuration
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v5",
        alwaysCompile: false,
    },
};

// Export the configuration object using CommonJS syntax
module.exports = config;
