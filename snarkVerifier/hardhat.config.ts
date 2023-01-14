import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// import "@tovarishfin/hardhat-yul";

const config: HardhatUserConfig = {
    solidity: "0.8.7",
    allowJs: true,
    noImplicitAny: false
};

export default config;
