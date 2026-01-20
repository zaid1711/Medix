require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

const CONTRACT_ABI = [
  // Add only the relevant ABI fragments for used functions here for brevity
  "function addPatient(address patient) public",
  "function addDoctor(address doctor) public",
  "function uploadRecord(string memory fileHash, string memory fileName, string memory date) public",
  "function getPatientRecords(address patient) public view returns (tuple(string fileHash, string fileName, string date, string doctorNote, address uploadedBy)[])",
  "function roles(address) public view returns (uint8)"
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const ehrContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// --- POST /registerPatient ---
app.post("/registerPatient", async (req, res) => {
  try {
    const { patientAddress } = req.body;
    const tx = await ehrContract.addPatient(patientAddress);
    await tx.wait();
    res.json({ message: "Patient registered", patientAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- POST /registerDoctor ---
app.post("/registerDoctor", async (req, res) => {
  try {
    const { doctorAddress } = req.body;
    const tx = await ehrContract.addDoctor(doctorAddress);
    await tx.wait();
    res.json({ message: "Doctor registered", doctorAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- POST /uploadRecord ---
app.post("/uploadRecord", async (req, res) => {
  try {
    const { patientAddress, fileHash, fileName, date } = req.body;
    // Wallet must be patient for this call or your contract must allow admin to upload on behalf
    if (wallet.address.toLowerCase() !== patientAddress.toLowerCase()) {
      return res.status(403).json({ error: "Wallet address must match patient address" });
    }
    const tx = await ehrContract.uploadRecord(fileHash, fileName, date);
    await tx.wait();
    res.json({ message: "Record uploaded", patientAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET /records/:patientId ---
app.get("/records/:patientId", async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const records = await ehrContract.getPatientRecords(patientId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update appointment with doctor response
app.put("/appointments/:appointmentId/response", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorNotes, doctorMessage } = req.body;
    
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doctor = users.find(u => u.walletAddress === decoded.walletAddress && u.role === 'doctor');
    
    if (!doctor) {
      return res.status(403).json({ error: "Access denied. Doctor account required." });
    }
    
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    // Update appointment with doctor response and timestamp
    appointment.doctorNotes = doctorNotes || appointment.doctorNotes;
    appointment.doctorMessage = doctorMessage || appointment.doctorMessage;
    appointment.responseDate = new Date().toISOString();
    appointment.respondedBy = doctor._id;
    appointment.updatedAt = new Date().toISOString();
    
    // If sending a response, automatically confirm the appointment if it's still pending
    if (appointment.status === 'pending') {
      appointment.status = 'confirmed';
    }
    
    res.json({ 
      message: "Doctor response sent successfully", 
      appointment: appointment 
    });
  } catch (error) {
    console.error("Error sending doctor response:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
