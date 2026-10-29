import { ethers } from "hardhat";

async function main() {
  console.log("Checking connection to MST Blockchain Testnet...");
  
  const provider = ethers.provider;
  const network = await provider.getNetwork();
  
  console.log(`Connected successfully!`);
  console.log(`Chain ID: ${network.chainId.toString()}`);
  console.log(`Expected Chain ID: 91562037`);
  
  if (network.chainId.toString() === "91562037") {
    console.log(" Chain ID match confirmed for MST Blockchain Testnet.");
  } else {
    console.log(" Chain ID differs from expected 91562037.");
  }
  
  const blockNumber = await provider.getBlockNumber();
  console.log(`Latest block on MST Testnet: #${blockNumber}`);
}

main().catch((error) => {
  console.error("Error connecting to MST Testnet:", error);
  process.exit(1);
});
