const hre = require("hardhat");

async function main() {
  const EHR = await hre.ethers.getContractFactory("contracts/Counter.sol:EHRContract");
  const ehr = await EHR.deploy();
  await ehr.waitForDeployment();

  console.log("EHRContract deployed to:", ehr.target);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
