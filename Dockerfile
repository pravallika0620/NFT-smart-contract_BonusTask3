# Dockerfile

# Stage 1: Use a recent Node Alpine image for a lightweight base
FROM docker.io/library/node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies (Hardhat, Ethers, OpenZeppelin, etc.)
# Using the --legacy-peer-deps flag ensures the Hardhat 3 toolbox dependencies resolve correctly.
COPY package.json package-lock.json ./
# Force fresh npm install - December 12, 2025 (10:00 AM)
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .
RUN rm -f contracts/Counter.t.sol
# Compile the contract (This ensures the typechain-types folder is generated in the container)
RUN npx hardhat compile

# Default command: Run the test suite
# This is the command that executes when the container is run.
CMD ["npx", "hardhat", "test"]
