import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as fs from "fs";
import { BigNumber } from "ethers";

describe("MockDataVerifier", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployVerificationFixture() {
        const ONE_GWEI = 1_000_000_000;
        const GAS_LIMIT = 30_000_000

        const lockedAmount = ONE_GWEI;
        const max_txs = 14;
        const max_calldata = 100000;

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();
        const Verifier = await ethers.getContractFactory("Verifier");
        const verifier = await Verifier.deploy(max_txs, max_calldata, { value: lockedAmount, gasLimit: GAS_LIMIT });

        return { verifier, max_txs: max_txs, max_calldata: max_calldata, lockedAmount, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right unlockTime", async function () {
            const { verifier, max_txs, max_calldata } = await loadFixture(deployVerificationFixture);
            expect(await verifier.max_txs()).to.equal(max_txs);
            expect(await verifier.max_calldata()).to.equal(max_calldata);
        });

        it("Should set the right owner", async function () {
            const { verifier, owner } = await loadFixture(deployVerificationFixture);
            expect(await verifier.owner()).to.equal(owner.address);
        });

        it("Should receive and store the funds to lock", async function () {
            const { verifier, lockedAmount } = await loadFixture(
                deployVerificationFixture
            );
            expect(await ethers.provider.getBalance(verifier.address)).to.equal(
                lockedAmount
            );
        });
    });

    describe("Simple point verify test", function () {
        it("Point verify success", async function () {
            const { verifier } = await loadFixture(deployVerificationFixture);
            // x = "0x29d5df054bc68e510988253b6c4718f165be7e7b98692f103902a72923824292";
            // y = "0x0b17509e943ce79ce0d1de8bf65bff3e466a0885cdd180bfa101bd606345be97";
            const pointHex = "29d5df054bc68e510988253b6c4718f165be7e7b98692f103902a72923824292" +
                             "0b17509e943ce79ce0d1de8bf65bff3e466a0885cdd180bfa101bd606345be97"
            const pointBytes = Buffer.from(pointHex, 'hex');
            expect(await verifier.verifyPoint(pointBytes)).to.be.ok;
        });

        it("Point verify failed", async function () {
            const { verifier } = await loadFixture(deployVerificationFixture);
            var data = Buffer.alloc(0x40).fill('x');
            await expect(verifier.verifyPoint(data)).to.be.reverted;
        });
    });

    let g_mock_data_buffer = Buffer.alloc(0);

    describe("Verify mock data", function () {
        before("load calldata to global buffer", function () {
            var Buffer = require('buffer').Buffer;
            const mock_calldata_file = "./data/calldata.bin";
            fs.open(mock_calldata_file, 'r', function (status, fd) {
                if (status) {
                    console.log(status.message);
                    return;
                }

                var stats = fs.statSync(mock_calldata_file);
                var fileSizeInBytes = stats.size;

                var buffer = Buffer.alloc(fileSizeInBytes);
                var i = 0;
                fs.read(fd, buffer, 0, fileSizeInBytes, 0, (function (err, num) {
                    // console.log(buffer.toString("hex"));
                }));

                g_mock_data_buffer = buffer;
            });
        })

        it("Should proof verify pass", async function () {
            const { verifier } = await loadFixture(deployVerificationFixture);
            var buffer = Buffer.from(g_mock_data_buffer);

            // console.log("test calldata:", buffer.toString("hex"));
            expect(await verifier.verifyMockData(buffer)).to.be.ok;
        });

        it("Should proof verify revert", async function () {
            const { verifier } = await loadFixture(deployVerificationFixture);
            var buffer = Buffer.from(g_mock_data_buffer);

            buffer[0] = 1
            await expect(verifier.verifyMockData(buffer)).to.be.reverted;
        });
    });
});
