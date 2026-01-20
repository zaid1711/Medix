const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Add password field
  role: { type: String, required: true, enum: ["Admin", "Doctor", "Patient"] },
  walletAddress: { type: String, required: true, unique: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
