const hre = require("hardhat");
const fs = require("fs");
const { spawn, spawnSync } = require("node:child_process");
import { expect } from "chai";
import { BigNumber } from "ethers";
import { exit } from "process";
const os = require("os");

describe("AggregationVerifier", async function() {
    async function compilePlonkVerifier(sourceFile: string, callback: any) {
        let SOLC_COMMAND = "";
        if (os.platform() == "darwin") {
            SOLC_COMMAND = "./bin/solc.darwin";
        } else if (os.platform() == "linux") {
            SOLC_COMMAND = "./bin/solc.linux";
        } else {
            exit(-1);
        }
    
        // download solc if not exist.
        if (!fs.existsSync(SOLC_COMMAND)) {
            console.log("downloading solc ...");
            spawnSync("tasks/download_solc.sh");
            console.log("download finished.");
        }
    
        // const sourceFile = "./contracts/yul/TestnetVerifier.yul";
        const compile = spawnSync(SOLC_COMMAND, ["--yul", "--bin", sourceFile]);
        let output = compile.stdout.toString();
    
        let address = "";
        const lines = output.split("\n");
        const tag = "Binary representation:";

        let next = false;
        for (const line of lines) {
            if (next) {
                address = await callback(line);
                break;
            }

            if (line === tag) {
                next = true;
            }
        }
        return {address: address}
    }

    async function compileAndDeployPlonkVerifier(sourceFile: string) {
        const [signer] = await hre.ethers.getSigners();
        console.log("signer addr:", signer.address);

        let address = await compilePlonkVerifier(sourceFile, async function (bin: string) {
                // console.log("bin:", bin)
                const tx = await signer.sendTransaction({
                    data: "0x" + bin,
                });

                // console.log(tx)
                const receipt = await tx.wait();
                // console.log("receipt:", receipt)
                return receipt.contractAddress;; 
        });
        return address;
    }

    function load_call_data() {
        var Buffer = require('buffer').Buffer;
        let testnet_proof_file = "./data/standalone_proof.json";
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
        return testnet_data;
    }

    let u256ToByteArray = function(/*long*/u256num: BigNumber) {
        // we want to represent the input as a 32-bytes array
        var byteArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        // console.log(u256num);    
        for ( var index = 0; index < byteArray.length; index ++ ) {
            var byte = u256num.and(0xff);
            byteArray [ byteArray.length - 1 - index ] = byte.toNumber();
            u256num = u256num.shr(8);
        }
        return byteArray;
    };
    

    function load_zkchain_proof(zkchain_proof_file: string) {
        var Buffer = require('buffer').Buffer;
        var proof_data = JSON.parse(fs.readFileSync(zkchain_proof_file).toString());
        var data = proof_data.result.circuit;

        let evenHexLen = data.proof.length - 2 + (data.proof.length % 2)
        let proof_bytes = Buffer.from(data.proof.slice(2).padStart(evenHexLen, '0'), 'hex');
        let bufLen = data.instance.length * 32 + proof_bytes.length;
        var testnet_data = Buffer.alloc(bufLen);

        var test_idx = 0;
        for (let i = 0; i < data.instance.length; i++) {
            var uint256Bytes = Buffer.alloc(32);
            let evenHexLen = data.instance[i].length - 2 + (data.instance[i].length % 2) 
            let instanceBytes = Buffer.from(data.instance[i].slice(2).padStart(evenHexLen, '0'), 'hex');
            for (let j = 0; j < instanceBytes.length; j++) {
                uint256Bytes[31-j] = instanceBytes[instanceBytes.length-1-j]
            }
            for (let k = 0; k < 32; k++){
                testnet_data[test_idx] = uint256Bytes[k];
                test_idx++;
            }
        }

        for(let i = 0; i < proof_bytes.length; i++) {
            testnet_data[test_idx] = proof_bytes[i];
            test_idx++;
        }
    
        console.log(testnet_data.toString("hex"));
        return testnet_data;
        
    }

    let zkchain_verifier = "";
    let zkchain_proof = Buffer.alloc(0);

    before("deploy yul binary contract", async function () {
        var {address} = await compileAndDeployPlonkVerifier("./contracts/yul/aggregation_plonk_1_to_1.yul");
        zkchain_verifier = address;
        zkchain_proof = load_zkchain_proof("./data/aggregation_1_to_1.json");

        // console.log(verifierAddress)
    });
    
    it("zkchain proof format verify pass", async function() {
        const testVerifier = await (
            await hre.ethers.getContractFactory("StandaloneVerifier")
        ).deploy();
    
        // console.log("proof verify res:", res);
        expect(await testVerifier.verifyZKP(zkchain_verifier, zkchain_proof)).to.be.true;
    });

});

