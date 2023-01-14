import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const max_txs = 14;
  const max_calldata = 100000;

  const lockedAmount = ethers.utils.parseEther("1");

  const Verifier = await ethers.getContractFactory("Verifier");
  const verifier = await Verifier.deploy(max_txs, max_calldata, { value: lockedAmount });

  await verifier.deployed();

  console.log(`Deploy ${max_txs} ${max_calldata} verifier deployed to ${verifier.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
