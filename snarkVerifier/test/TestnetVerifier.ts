import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from "fs";

describe("TestnetVerifier", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployTestnetVerifierFixture() {
        const ONE_GWEI = 1_000_000_000;
        const GAS_LIMIT = 30_000_000

        const lockedAmount = ONE_GWEI;
        const max_txs = 14;
        const max_calldata = 10500;

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();
        const TestnetVerifier = await ethers.getContractFactory("TestnetVerifier");
        const testnetVerifier = await TestnetVerifier.deploy(max_txs, max_calldata, { value: lockedAmount, gasLimit: GAS_LIMIT });

        return { verifier: testnetVerifier, max_txs: max_txs, max_calldata: max_calldata, lockedAmount, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            const { verifier, max_txs, max_calldata } = await loadFixture(deployTestnetVerifierFixture);
            expect(await verifier.max_txs()).to.equal(max_txs);
            expect(await verifier.max_calldata()).to.equal(max_calldata);
        });

        it("Should set the right owner", async function () {
            const { verifier, owner } = await loadFixture(deployTestnetVerifierFixture);
            expect(await verifier.owner()).to.equal(owner.address);
        });
    });

    let g_testnet_data = Buffer.alloc(1);

    describe("verify real data with max_txs=14, max_calldata=10500", async function() {
        before("load calldata to global buffer", function () {
            var Buffer = require('buffer').Buffer;
            let testnet_proof_file = "./data/block-5_proof.json";
            var data = JSON.parse(fs.readFileSync(testnet_proof_file).toString());

            let bufLen = data.instances.length * 32 + data.proof.length;
            var testnet_data = Buffer.alloc(bufLen);
            var test_idx = 0;

            for (let i = 0; i < data.instances.length; i++) {
                var uint256Bytes = Buffer.alloc(32);
                let evenHexLen = data.instances[i].length - 2 + (data.instances[i].length % 2) 
                let instanceBytes = Buffer.from(data.instances[i].slice(2).padStart(evenHexLen, '0'), 'hex');
                for (let j = 0; j < instanceBytes.length; j++) {
                    uint256Bytes[31-j] = instanceBytes[instanceBytes.length-1-j]
                }
                for (let k = 0; k < 32; k++){
                    testnet_data[test_idx] = uint256Bytes[k];
                    test_idx++;
                }
            }

            for(let i = 0; i < data.proof.length; i++) {
                testnet_data[test_idx] = data.proof[i];
                test_idx++;
            }

            // console.log(testnet_data);
            g_testnet_data = testnet_data;

        })

        it("should verify ok", async function() {
            const { verifier } = await loadFixture(deployTestnetVerifierFixture);
            var buffer = Buffer.from(g_testnet_data);
            // console.log("test calldata:", buffer.toString("hex"));
            expect(await verifier.verifyTestNetData(buffer)).to.be.ok;
        });

        it("should verify fail", async function() {
            const { verifier } = await loadFixture(deployTestnetVerifierFixture);
            var buffer = Buffer.from(g_testnet_data);
            buffer[0] = 1;
            await expect(verifier.verifyTestNetData(buffer)).to.be.reverted;
        });
    });
});
