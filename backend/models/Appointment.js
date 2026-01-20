const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  patientWalletAddress: { 
    type: String, 
    required: true 
  },
  doctorWalletAddress: { 
    type: String, 
    required: true 
  },
  healthProblem: { 
    type: String, 
    required: true,
    maxLength: 1000
  },
  appointmentDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending"
  },
  attachedFiles: [{
    fileName: { type: String, required: true },
    fileHash: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
  }],
  doctorNotes: { 
    type: String,
    maxLength: 2000
  },
  doctorMessage: { 
    type: String,
    maxLength: 1000
  },
  doctorResponseDate: { 
    type: Date 
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium"
  }
}, { timestamps: true });

// Index for efficient queries
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, status: 1, appointmentDate: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
