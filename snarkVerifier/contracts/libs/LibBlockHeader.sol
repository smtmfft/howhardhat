// SPDX-License-Identifier: MIT
//  _____     _ _         _         _
// |_   _|_ _(_) |_____  | |   __ _| |__ ___
//   | |/ _` | | / / _ \ | |__/ _` | '_ (_-<
//   |_|\__,_|_|_\_\___/ |____\__,_|_.__/__/

pragma solidity ^0.8.9;

import "../thirdparty/LibRLPWriter.sol";

/// @author david <david@taiko.xyz>
struct BlockHeader {
    bytes32 parentHash;
    bytes32 ommersHash;
    address beneficiary;
    bytes32 stateRoot;
    bytes32 transactionsRoot;
    bytes32 receiptsRoot;
    bytes32[8] logsBloom;
    uint256 difficulty;
    uint64 height;
    uint64 gasLimit;
    uint64 gasUsed;
    uint64 timestamp;
    bytes extraData;
    bytes32 mixHash;
    uint64 nonce;
    uint256 baseFeePerGas;
}

library LibBlockHeader {
    bytes32 private constant EMPTY_OMMERS_HASH =
        0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347;

    function hashBlockHeader(
        BlockHeader memory header,
        address prover,
        bytes32 txListHash
    ) internal pure returns (bytes16, bytes16) {
        bytes[] memory list;
        if (header.baseFeePerGas == 0) {
            // non-EIP11559 transaction
            list = new bytes[](17);
        } else {
            // EIP1159 transaction
            list = new bytes[](18);
        }
        list[0] = LibRLPWriter.writeHash(header.parentHash);
        list[1] = LibRLPWriter.writeHash(header.ommersHash);
        list[2] = LibRLPWriter.writeAddress(header.beneficiary);
        list[3] = LibRLPWriter.writeHash(header.stateRoot);
        list[4] = LibRLPWriter.writeHash(header.transactionsRoot);
        list[5] = LibRLPWriter.writeHash(header.receiptsRoot);
        list[6] = LibRLPWriter.writeBytes(abi.encodePacked(header.logsBloom));
        list[7] = LibRLPWriter.writeUint(header.difficulty);
        list[8] = LibRLPWriter.writeUint64(header.height);
        list[9] = LibRLPWriter.writeUint64(header.gasLimit);
        list[10] = LibRLPWriter.writeUint64(header.gasUsed);
        list[11] = LibRLPWriter.writeUint64(header.timestamp);
        list[12] = LibRLPWriter.writeBytes(header.extraData);
        list[13] = LibRLPWriter.writeHash(header.mixHash);
        // According to the ethereum yellow paper, we should treat `nonce`
        // as [8]byte when hashing the block.
        list[14] = LibRLPWriter.writeBytes(abi.encodePacked(header.nonce));
        if (header.baseFeePerGas != 0) {
            // non-EIP11559 transaction
            list[15] = LibRLPWriter.writeUint(header.baseFeePerGas);
            list[16] = LibRLPWriter.writeAddress(prover);
            list[17] = LibRLPWriter.writeHash(txListHash);
        } else {
            list[15] = LibRLPWriter.writeAddress(prover);
            list[16] = LibRLPWriter.writeHash(txListHash);
        }

        bytes memory rlpHeader = LibRLPWriter.writeList(list);
        return cutSha(keccak256(rlpHeader));
    }

    function cutSha(
        bytes32 source
    ) internal pure returns (bytes16 half1, bytes16 half2) {
        half1 = bytes16(source);
        half2 = bytes16(uint128(uint256(source)));
    }

    function isPartiallyValidForTaiko(
        uint256 blockMaxGasLimit,
        BlockHeader calldata header
    ) internal pure returns (bool) {
        return
            header.parentHash != 0 &&
            header.ommersHash == EMPTY_OMMERS_HASH &&
            header.gasLimit <= blockMaxGasLimit &&
            header.extraData.length <= 32 &&
            header.difficulty == 0 &&
            header.nonce == 0;
    }
}
