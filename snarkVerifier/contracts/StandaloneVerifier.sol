// SPDX-License-Identifier: MIT
//
// ╭━━━━╮╱╱╭╮╱╱╱╱╱╭╮╱╱╱╱╱╭╮
// ┃╭╮╭╮┃╱╱┃┃╱╱╱╱╱┃┃╱╱╱╱╱┃┃
// ╰╯┃┃┣┻━┳┫┃╭┳━━╮┃┃╱╱╭━━┫╰━┳━━╮
// ╱╱┃┃┃╭╮┣┫╰╯┫╭╮┃┃┃╱╭┫╭╮┃╭╮┃━━┫
// ╱╱┃┃┃╭╮┃┃╭╮┫╰╯┃┃╰━╯┃╭╮┃╰╯┣━━┃
// ╱╱╰╯╰╯╰┻┻╯╰┻━━╯╰━━━┻╯╰┻━━┻━━╯
pragma solidity ^0.8.7;

import "hardhat/console.sol";

contract StandaloneVerifier {
    function verifyZKP(
        address prover,
        bytes calldata zkproof
    ) external view returns (bool verified) {
        bytes memory res;
        // bool verified = false;
        (verified, res) = prover.staticcall(zkproof);
        // console.logBytes(res);
        bytes32 h = keccak256("taiko");
        require(h == 0x93ac8fdbfc0b0608f9195474a0dd6242f019f5abc3c4e26ad51fefb059cc0177);
        console.logBytes(res);
        require(res[0] == 0x93);
        require(res[1] == 0xac);
    }
}