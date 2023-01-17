// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract SimpleAssembly {
    address payable public owner;

    constructor() payable {
        owner = payable(msg.sender);
    }

    function simpleAssemblyReturn() public pure {
        assembly {
            return(0, 0)
        }
    }

    function simpleAssemblyRevert() public pure {
        assembly {
            revert(0, 0)
        }
    }

    function simpleAssemblyRevertWithReturn() public pure returns (uint){
        assembly {
            revert(0, 0)
        }
    }

    function simpleAssemblyConditionalRevert(bytes calldata) public pure returns (uint256) {
        assembly {
            let x := calldataload(0x0)
            if iszero(x) {
                revert(0, 0)
            }
            mstore(0x00, x)
            return(0, 32)
        }
    }

    function simpleAssemblyCalldataLoad(bytes calldata) public pure returns (uint) {
        assembly {
            function calldataload_with_offset(ptr) -> data {
                data := calldataload(add(ptr, 0x44))
            }
            let x := calldataload_with_offset(0x0)
            if iszero(x) {
                revert(0, 0)
            }
            mstore(0x00, x)
            return(0, 32)
        }
    }
}
