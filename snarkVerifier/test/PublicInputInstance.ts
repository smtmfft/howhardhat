import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import * as log from "./log";
const EBN = ethers.BigNumber;

describe("Public Input Instance", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployLibBlockHeaderFixture() {
        const ONE_GWEI = 1_000_000_000;
        const GAS_LIMIT = 30_000_000

        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const TestBlockHeader = await ethers.getContractFactory("TestLibBlockHeader");
        const testBlockHeader = await TestBlockHeader.deploy({value: 0, gasLimit: GAS_LIMIT });

        return { testBlockHeader, owner, otherAccount };
    }
    
    describe("test lib block header", function () {
        let testBlockHeader: any;

        before("deployment", async function(){
            let a = await loadFixture(deployLibBlockHeaderFixture);
            testBlockHeader = a.testBlockHeader;
        });

        it("can calculate block header hash correctly", async function () {
            const blockHash =
                "0xc0528bca43a7316776dddb92380cc3a5d9e717bc948ce71f6f1605d7281a4fe8";
            // block 0xc0528bca43a7316776dddb92380cc3a5d9e717bc948ce71f6f1605d7281a4fe8 on Ethereum mainnet
    
            const parentHash =
                "0xa7881266ca0a344c43cb24175d9dbd243b58d45d6ae6ad71310a273a3d1d3afb";
    
            const l2BlockHeader: any = {
                parentHash: parentHash,
                ommersHash:
                    "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
                beneficiary: "0xea674fdde714fd979de3edf0f56aa9716b898ec8",
                stateRoot:
                    "0xc0dcf937b3f6136dd70a1ad11cc57b040fd410f3c49a5146f20c732895a3cc21",
                transactionsRoot:
                    "0x7273ade6b6ed865a9975ac281da23b90b141a8b607d874d2cd95e65e81336f8e",
                receiptsRoot:
                    "0x74bb61e381e9238a08b169580f3cbf9b8b79d7d5ee708d3e286103eb291dfd08",
                logsBloom:
                    "112d60abc05141f1302248e0f4329627f002380f1413820692911863e7d0871261aa07e90cc01a10c3ce589153570dc2db27b8783aa52bc19a5a4a836722e813190401b4214c3908cb8b468b510c3fe482603b00ca694c806206bf099279919c334541094bd2e085210373c0b064083242d727790d2eecdb2e0b90353b66461050447626366328f0965602e8a9802d25740ad4a33162142b08a1b15292952de423fac45d235622bb0ef3b2d2d4c21690d280a0b948a8a3012136542c1c4d0955a501a022e1a1a4582220d1ae50ba475d88ce0310721a9076702d29a27283e68c2278b93a1c60d8f812069c250042cc3180a8fd54f034a2da9a03098c32b03445"
                        .match(/.{1,64}/g)!
                        .map((s) => "0x" + s),
                difficulty: EBN.from("0x1aedf59a4bc180"),
                height: EBN.from("0xc5ad78"),
                gasLimit: EBN.from("0xe4e1c0"),
                gasUsed: EBN.from("0xe4a463"),
                timestamp: EBN.from("0x6109c56e"),
                extraData: "0x65746865726d696e652d75732d7765737431",
                mixHash:
                    "0xf5ba25df1e92e89a09e0b32063b81795f631100801158f5fa733f2ba26843bd0",
                nonce: EBN.from("0x738b7e38476abe98"),
                baseFeePerGas: 0,
            };
    
            const headerComputed = await testBlockHeader.rlpBlockHeader(
                l2BlockHeader
            );
            log.debug("headerComputed:", headerComputed);
    
            expect(headerComputed).to.equal(blockHash);
        });
    });
});
