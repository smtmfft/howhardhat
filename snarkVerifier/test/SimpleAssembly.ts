import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

describe("SimpleAssembly", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deploySimpleAssemblyFixture() {
        const ONE_GWEI = 1_000_000_000;
        const GAS_LIMIT = 30_000_000

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const SimpleAssembly = await ethers.getContractFactory("SimpleAssembly");
        const simpleAssembly = await SimpleAssembly.deploy({value: 0, gasLimit: GAS_LIMIT });

        return { simpleAssembly, owner, otherAccount };
    }
    
    describe("test simple assembly", function () {
        it("simple return", async function(){
            const { simpleAssembly } = await loadFixture(deploySimpleAssemblyFixture);
            expect(await simpleAssembly.simpleAssemblyReturn()).to.be.ok;
        });

        it.skip("simple revert", async function(){
            const { simpleAssembly } = await loadFixture(deploySimpleAssemblyFixture);
            await expect(simpleAssembly.simpleAssemblyRevert()).to.be.reverted;
        });

        it("simple revert with return", async function(){
            const { simpleAssembly } = await loadFixture(deploySimpleAssemblyFixture);
            await expect(simpleAssembly.simpleAssemblyRevertWithReturn()).to.be.reverted;
        });

        it("load calldata with offset", async function() {
            const { simpleAssembly } = await loadFixture(deploySimpleAssemblyFixture);
            var buffer = Buffer.alloc(32);
            buffer[31] = 1
            expect(await simpleAssembly.simpleAssemblyCalldataLoad(buffer)).to.be.equal(1);
        });

        it("load calldata with offset revert if buffer is 0", async function() {
            const { simpleAssembly } = await loadFixture(deploySimpleAssemblyFixture);
            var buffer = Buffer.alloc(32);
            await expect(simpleAssembly.simpleAssemblyCalldataLoad(buffer)).to.be.reverted;
        });
    });

});
