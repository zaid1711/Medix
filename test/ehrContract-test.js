const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EHRContract", function () {
  let ehrContract;
  let admin, doctor1, patient1, other;

  beforeEach(async () => {
    // Get signers
    [admin, doctor1, patient1, other] = await ethers.getSigners();

    // Deploy fresh contract before each test
    const EHR = await ethers.getContractFactory("EHRContract");
    ehrContract = await EHR.deploy();
    await ehrContract.waitForDeployment();

    // admin is deployer, set roles
  });

  it("should set deployer as Admin", async function () {
    expect(await ehrContract.roles(admin.address)).to.equal(1); // Role.Admin = 1
  });

  it("Admin can add a Doctor and Patient", async function () {
    await ehrContract.connect(admin).addDoctor(doctor1.address);
    await ehrContract.connect(admin).addPatient(patient1.address);

    expect(await ehrContract.roles(doctor1.address)).to.equal(2);  // Role.Doctor = 2
    expect(await ehrContract.roles(patient1.address)).to.equal(3); // Role.Patient = 3
  });

  it("Patient can upload a medical record", async function () {
    await ehrContract.connect(admin).addPatient(patient1.address);

    await ehrContract.connect(patient1).uploadRecord(
      "QmHashExample123",
      "BloodTest.pdf",
      "2025-08-21"
    );

    const records = await ehrContract.getPatientRecords(patient1.address);
    expect(records.length).to.equal(1);
    expect(records[0].fileName).to.equal("BloodTest.pdf");
  });

  it("Doctor can add notes to patient's record", async function () {
    await ehrContract.connect(admin).addDoctor(doctor1.address);
    await ehrContract.connect(admin).addPatient(patient1.address);

    await ehrContract.connect(patient1).uploadRecord(
      "QmHashExample123",
      "BloodTest.pdf",
      "2025-08-21"
    );

    await ehrContract.connect(doctor1).addDoctorNote(patient1.address, 0, "All good");

    const records = await ehrContract.getPatientRecords(patient1.address);
    expect(records[0].doctorNote).to.equal("All good");
  });

  it("Unauthorized user cannot add doctor note or upload record", async function () {
    await expect(
      ehrContract.connect(other).uploadRecord("QmHash", "Test.pdf", "2025-08-21")
    ).to.be.revertedWith("Only Patient can do this");

    await expect(
      ehrContract.connect(other).addDoctorNote(patient1.address, 0, "Note")
    ).to.be.revertedWith("Only Doctor can do this");
  });
});
