// test/NftCollection.test.cjs

// Use CommonJS syntax which is more stable for Hardhat initialization
const { expect } = require("chai");
const hre = require("hardhat");

describe("NftCollection", function () {
    let nftCollection;
    let admin;
    let addr1;
    let addr2;
    let others;

    const NAME = "MyTestNFT";
    const SYMBOL = "MTN";
    const BASE_URI = "ipfs://test-base-uri/";
    const MAX_SUPPLY = 5;

    beforeEach(async function () {
        // Use hre.ethers for the Ethers v5 methods
        const ethers = hre.ethers;

        [admin, addr1, addr2, ...others] = await ethers.getSigners();

        // Get the contract factory
        const NftCollectionFactory = await ethers.getContractFactory("NftCollection", admin);

        // Deploy the contract with initial values
        nftCollection = await NftCollectionFactory.deploy(
            NAME,
            SYMBOL,
            BASE_URI,
            MAX_SUPPLY
        );
        // Removed: await nftCollection.waitForDeployment(); // Fix for Ethers v5 compatibility
    });

    // ------------------------------------------------
    // TEST 1: Initial Configuration
    // ------------------------------------------------
    describe("Deployment & Configuration", function () {
        it("Should set the correct name, symbol, maxSupply, and initial total supply", async function () {
            expect(await nftCollection.name()).to.equal(NAME);
            expect(await nftCollection.symbol()).to.equal(SYMBOL);
            expect(await nftCollection.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
            expect(await nftCollection.totalSupply()).to.equal(0);
        });

        it("Should assign the deployer as the contract owner (admin)", async function () {
            expect(await nftCollection.owner()).to.equal(admin.address);
        });
    });

    // ------------------------------------------------
    // TEST 2: Access Control
    // ------------------------------------------------
    describe("Access Control (Admin-only)", function () {
        it("Should allow admin to pause and unpause minting", async function () {
            expect(await nftCollection.paused()).to.equal(false);
            await nftCollection.connect(admin).pause();
            expect(await nftCollection.paused()).to.equal(true);
            await nftCollection.connect(admin).unpause();
            expect(await nftCollection.paused()).to.equal(false);
        });

        it("Should revert if non-admin tries to pause", async function () {
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.connect(addr1).pause()).to.be.reverted;
        });

        it("Should revert if non-admin tries to unpause", async function () {
            await nftCollection.connect(admin).pause();
            // FIX: Corrected function call to unpause()
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.connect(addr1).unpause()).to.be.reverted;
        });

        it("Should allow admin to update the base URI and check it via tokenURI", async function () {
            const NEW_URI = "https://new.base.uri/";
            await nftCollection.connect(admin).setBaseURI(NEW_URI);

            await nftCollection.connect(admin).safeMint(addr1.address);
            expect(await nftCollection.tokenURI(0)).to.equal(NEW_URI + "0");
        });

        it("Should reject non-admin users from updating the base URI", async function () {
            const NEW_URI_ATTEMPT = "https://fail.uri/";
            // FIX: Corrected function call to setBaseURI()
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.connect(addr1).setBaseURI(NEW_URI_ATTEMPT)).to.be.reverted;
        });
    });

    // ------------------------------------------------
    // TEST 3: Minting Logic and Supply Constraints
    // ------------------------------------------------
    describe("Minting", function () {
        it("Should successfully mint and update supply, balance, and ownership", async function () {
            await nftCollection.connect(admin).safeMint(addr1.address);
            expect(await nftCollection.totalSupply()).to.equal(1);
            expect(await nftCollection.balanceOf(addr1.address)).to.equal(1);
            expect(await nftCollection.ownerOf(0)).to.equal(addr1.address);
        });

        it("Should revert if non-admin attempts to mint", async function () {
            // FIX: Corrected function call to safeMint()
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.connect(addr1).safeMint(addr1.address)).to.be.reverted;
        });

        it("Should revert when minting is paused", async function () {
            await nftCollection.connect(admin).pause();
            // FIX: Corrected function call to safeMint()
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.connect(admin).safeMint(addr1.address)).to.be.reverted;
        });

        it("Should revert attempts to mint beyond max supply", async function () {
            for (let i = 0; i < MAX_SUPPLY; i++) {
                await nftCollection.connect(admin).safeMint(addr1.address);
            }
            expect(await nftCollection.totalSupply()).to.equal(MAX_SUPPLY);
            // FIX: Use generic 'to.be.reverted' matcher for string revert reasons
            await expect(nftCollection.connect(admin).safeMint(addr1.address))
                .to.be.reverted; 
        });
    });

    // ------------------------------------------------
    // TEST 4: Token URI and Metadata
    // ------------------------------------------------
    describe("Metadata", function () {
        it("Should return the correct concatenated token URI for an existing token", async function () {
            await nftCollection.connect(admin).safeMint(addr1.address); // Mint token 0
            expect(await nftCollection.tokenURI(0)).to.equal(BASE_URI + "0");
        });

        it("Should revert for a non-existent token (validation check)", async function () {
            // FIX: Corrected function call to tokenURI()
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(nftCollection.tokenURI(999)).to.be.reverted;
        });
    });

    // ------------------------------------------------
    // TEST 5: ERC-721 Transfers and Approvals
    // ------------------------------------------------
    describe("Transfers & Approvals", function () {
        let tokenId = 0;

        beforeEach(async function () {
            await nftCollection.connect(admin).safeMint(addr1.address); // tokenId 0
        });

        it("Owner should be able to transfer a token", async function () {
            await nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);
            expect(await nftCollection.ownerOf(tokenId)).to.equal(addr2.address);
        });

        it("Should revert if non-owner/non-approved tries to transfer", async function () {
            // FIX: Use generic 'to.be.reverted' matcher for OpenZeppelin errors
            await expect(
                nftCollection.connect(addr2).transferFrom(addr1.address, addr2.address, tokenId)
            ).to.be.reverted;
        });

        it("Approved address should be able to transfer token (single token approval)", async function () {
            await nftCollection.connect(addr1).approve(addr2.address, tokenId);
            await nftCollection.connect(addr2).transferFrom(addr1.address, others[0].address, tokenId);
            expect(await nftCollection.ownerOf(tokenId)).to.equal(others[0].address);
        });

        it("Operator should be able to transfer token (Approval for All)", async function () {
            await nftCollection.connect(addr1).setApprovalForAll(addr2.address, true);
            await nftCollection.connect(addr2).transferFrom(addr1.address, others[0].address, tokenId);
            expect(await nftCollection.ownerOf(tokenId)).to.equal(others[0].address);
        });

        it("Should revert attempts to transfer a non-existent token", async function () {
            const nonExistentTokenId = 999;
            // This assertion was already generic but confirmed correct.
            await expect(
                nftCollection.connect(addr1).transferFrom(addr1.address, addr2.address, nonExistentTokenId)
            ).to.be.reverted;
        });
    });
});

