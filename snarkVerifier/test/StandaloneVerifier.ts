const hre = require("hardhat");
const fs = require("fs");
const { spawn, spawnSync } = require("node:child_process");
import { expect } from "chai";

describe("StandaloneVerifier", async function() {
    async function compilePlonkVerifier(callback: any) {
        const SOLC_COMMAND = "./bin/solc";
    
        // download solc if not exist.
        if (!fs.existsSync(SOLC_COMMAND)) {
            console.log("downloading solc ...");
            spawnSync("tasks/download_solc.sh");
            console.log("download finished.");
        }
    
        const sourceFile = "./contracts/yul/TestnetVerifier.yul";
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

    async function compileAndDeployPlonkVerifier() {
        const [signer] = await hre.ethers.getSigners();
        // console.log("signer addr:", signer.address);

        let address = await compilePlonkVerifier(async function (bin: string) {
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

    let verifierAddress = "";
    let calldata = Buffer.alloc(0);

    before("deploy yul binary contract", async function () {
        const { address } = await compileAndDeployPlonkVerifier();
        verifierAddress = address;
        calldata = load_call_data();
    });
    
    it("standalone verify pass", async function() {
        const testVerifier = await (
            await hre.ethers.getContractFactory("StandaloneVerifier")
        ).deploy();
    
        const res = await testVerifier.verifyZKP(verifierAddress, calldata);
        // console.log("proof verify res:", res);
        expect(await testVerifier.verifyZKP(verifierAddress, calldata)).to.be.true;
    });

    it("standalone verify fail", async function() {
        const testVerifier = await (
            await hre.ethers.getContractFactory("StandaloneVerifier")
        ).deploy();
    
        let incorrect_calldata = Buffer.from(calldata);
        incorrect_calldata[0] = 1;
        expect(await testVerifier.verifyZKP(verifierAddress, incorrect_calldata)).to.be.false;
    });

});

