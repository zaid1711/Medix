const hre = require("hardhat");

async function main() {
  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const ehr = await hre.ethers.getContractAt("EHRContract", contractAddress);

  const [deployer, doctor, patient] = await hre.ethers.getSigners();

  console.log("Deployer role:", (await ehr.roles(deployer.address)).toString());

  await ehr.connect(deployer).addDoctor(doctor.address);
  console.log("Doctor added:", doctor.address);

  console.log("Doctor role:", (await ehr.roles(doctor.address)).toString());

  await ehr.connect(deployer).addPatient(patient.address);
  console.log("Patient added:", patient.address);

  await ehr.connect(patient).uploadRecord("QmHashExample", "TestFile.pdf", "2025-08-21");
  console.log("Patient uploaded a record");

  const records = await ehr.getPatientRecords(patient.address);
  console.log("Patient records:", records);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
