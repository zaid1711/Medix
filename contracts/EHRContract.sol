// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EHRContract {
    // --------------------------
    // ENUMS & STRUCTS
    // --------------------------
    enum Role { None, Admin, Doctor, Patient }

    struct Record {
        string fileHash;    // IPFS hash of medical document
        string fileName;    // name of document (X-ray, blood test, etc.)
        string date;        // date of record
        string doctorNote;  // optional diagnosis/notes provided by doctor
        address uploadedBy; // who uploaded (patient)
    }

    // --------------------------
    // STATE VARIABLES
    // --------------------------
    mapping(address => Role) public roles; // store user roles
    mapping(address => Record[]) private patientRecords; // maps patient to health records

    address public owner; // initial admin (deployer)

    // --------------------------
    // EVENTS
    // --------------------------
    event DoctorAdded(address doctor);
    event DoctorRemoved(address doctor);
    event PatientAdded(address patient);
    event PatientRemoved(address patient);
    event RecordUploaded(address patient, string fileHash, string fileName);
    event DoctorNoteAdded(address patient, uint256 recordId, string note);

    // --------------------------
    // MODIFIERS
    // --------------------------
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only Admin can do this");
        _;
    }

    modifier onlyDoctor() {
        require(roles[msg.sender] == Role.Doctor, "Only Doctor can do this");
        _;
    }

    modifier onlyPatient() {
        require(roles[msg.sender] == Role.Patient, "Only Patient can do this");
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.Admin; // Deployer is Admin
    }

    // --------------------------
    // ADMIN FUNCTIONS
    // --------------------------
    function addDoctor(address doctor) public onlyAdmin {
        roles[doctor] = Role.Doctor;
        emit DoctorAdded(doctor);
    }

    function removeDoctor(address doctor) public onlyAdmin {
        roles[doctor] = Role.None;
        emit DoctorRemoved(doctor);
    }

    function addPatient(address patient) public onlyAdmin {
        roles[patient] = Role.Patient;
        emit PatientAdded(patient);
    }

    function removePatient(address patient) public onlyAdmin {
        roles[patient] = Role.None;
        emit PatientRemoved(patient);
    }

    // --------------------------
    // PATIENT FUNCTIONS
    // --------------------------
    function uploadRecord(string memory fileHash, string memory fileName, string memory date) public onlyPatient {
        Record memory newRecord = Record(fileHash, fileName, date, "", msg.sender);
        patientRecords[msg.sender].push(newRecord);
        emit RecordUploaded(msg.sender, fileHash, fileName);
    }

    // --------------------------
    // DOCTOR FUNCTIONS
    // --------------------------
    function addDoctorNote(address patient, uint256 recordId, string memory note) public onlyDoctor {
        require(recordId < patientRecords[patient].length, "Invalid record ID");
        patientRecords[patient][recordId].doctorNote = note;
        emit DoctorNoteAdded(patient, recordId, note);
    }

    // --------------------------
    // READ FUNCTIONS
    // --------------------------
    function getPatientRecords(address patient) public view returns (Record[] memory) {
        require(
            msg.sender == patient || roles[msg.sender] == Role.Doctor || roles[msg.sender] == Role.Admin,
            "Not authorized"
        );
        return patientRecords[patient];
    }
}
