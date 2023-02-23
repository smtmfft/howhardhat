import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// import "@tovarishfin/hardhat-yul";

const config: HardhatUserConfig = {
	solidity: "0.8.9",
	allowJs: true,
	noImplicitAny: false,
	networks: {
		hardhat: {
			// blockGasLimit: 0x1fffffffffffff,
			allowUnlimitedContractSize: true,
		},
	},
};

export default config;
