const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  patientAddress: { type: String, required: true },
  fileHash: { type: String, required: true },
  fileName: { type: String, required: true },
  description: { type: String, default: "" }, // Patient's description of the medical record
  date: { type: Date, required: true },
  doctorNote: { type: String, default: "" },
  uploadedBy: { type: String, required: true }, // wallet address
}, { timestamps: true });

module.exports = mongoose.model("Document", documentSchema);