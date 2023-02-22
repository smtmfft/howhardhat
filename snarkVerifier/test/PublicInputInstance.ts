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
		const GAS_LIMIT = 30_000_000;

		// Contracts are deployed using the first signer/account by default
		const [owner, otherAccount] = await ethers.getSigners();

		const TestBlockHeader = await ethers.getContractFactory(
			"TestLibBlockHeader",
		);
		const testBlockHeader = await TestBlockHeader.deploy({
			value: 0,
			gasLimit: GAS_LIMIT,
		});

		return { testBlockHeader, owner, otherAccount };
	}

	describe("test lib block header", function () {
		let testBlockHeader: any;

		before("deployment", async function () {
			let a = await loadFixture(deployLibBlockHeaderFixture);
			testBlockHeader = a.testBlockHeader;
		});

		it("can calculate block header hash correctly", async function () {
			const blockHashHi = "0xf6b1d1e5c5f30f05d3a5020a5224cb08";
			// block 0xc0528bca43a7316776dddb92380cc3a5d9e717bc948ce71f6f1605d7281a4fe8 on Ethereum mainnet
			const blockHashLo = "0x59628cb5fab812b4ce562754ad497910";

			const parentHash =
				"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";

			const l2BlockHeader: any = {
				parentHash: parentHash,
				ommersHash:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				beneficiary: "0xDf08F82De32B8d460adbE8D72043E3a7e25A3B39",
				stateRoot:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				transactionsRoot:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				receiptsRoot:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				logsBloom:
					"112d60abc05141f1302248e0f4329627f002380f1413820692911863e7d0871261aa07e90cc01a10c3ce589153570dc2db27b8783aa52bc19a5a4a836722e813190401b4214c3908cb8b468b510c3fe482603b00ca694c806206bf099279919c334541094bd2e085210373c0b064083242d727790d2eecdb2e0b90353b66461050447626366328f0965602e8a9802d25740ad4a33162142b08a1b15292952de423fac45d235622bb0ef3b2d2d4c21690d280a0b948a8a3012136542c1c4d0955a501a022e1a1a4582220d1ae50ba475d88ce0310721a9076702d29a27283e68c2278b93a1c60d8f812069c250042cc3180a8fd54f034a2da9a03098c32b03445"
						.match(/.{1,64}/g)!
						.map((s) => "0x" + s),
				difficulty: 0,
				height: 0,
				gasLimit: 0,
				gasUsed: 0,
				timestamp: 0,
				extraData: [],
				mixHash:
					"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
				nonce: 0,
				baseFeePerGas: 0,
			};
			const prover = "0xDf08F82De32B8d460adbE8D72043E3a7e25A3B39";
			const txListHash =
				"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";

			console.log(testBlockHeader);
			const [headerComputedHi, headerComputedLo] =
				await testBlockHeader.hashBlockHeader(
					l2BlockHeader,
					prover,
					txListHash,
				);
			expect(headerComputedHi).to.equal(blockHashHi);
			expect(headerComputedLo).to.equal(blockHashLo);
		});
	});
});
