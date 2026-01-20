require("dotenv").config();
const { authenticateJWT, authorizeRoles } = require("./middleware/auth");
const bcrypt = require("bcrypt");
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const cors = require("cors");
const Document = require("./models/Document");
const Appointment = require("./models/Appointment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common medical document formats
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000", // Allow frontend origin
  credentials: true
}));
app.use(bodyParser.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection with better error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority'
    });
    
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    
    if (error.message.includes("ECONNREFUSED")) {
      console.error("Network connection refused. Check your internet connection and firewall settings.");
    } else if (error.message.includes("Authentication failed")) {
      console.error("Authentication failed. Check your username and password in MONGO_URI.");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("DNS resolution failed. Check your cluster URL in MONGO_URI.");
    }
    
    // Don't exit the process, just log the error
    // process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Add connection event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
});

// Blockchain Setup
let provider, wallet, ehrContract;

try {
  provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Minimal ABI for contract functions used
  const contractABI = [
    "function addPatient(address patient) public",
    "function addDoctor(address doctor) public",
    "function addAdmin(address admin) public",
    "function roles(address) public view returns (uint8)",
    "function uploadRecord(string fileHash, string fileName, string date) public",
    "function getPatientRecords(address patient) public view returns (tuple(string fileHash, string fileName, string date)[])"
  ];

  if (process.env.CONTRACT_ADDRESS) {
    ehrContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, wallet);
    console.log("Blockchain contract connected");
  } else {
    console.log("Warning: CONTRACT_ADDRESS not set. Blockchain features will be disabled.");
  }
} catch (error) {
  console.error("Blockchain setup error:", error.message);
}

// POST /registerPatient - Allow independent registration
app.post("/registerPatient", async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { name, email, walletAddress, password } = req.body;

    if (!name || !email || !walletAddress || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      walletAddress,
      password: hashedPassword,
      role: "Patient",
    });

    await newUser.save();

    // Only call blockchain if contract is available
    if (ehrContract) {
      try {
        const tx = await ehrContract.addPatient(walletAddress);
        await tx.wait();
        console.log("Patient added to blockchain");
      } catch (blockchainError) {
        console.error("Blockchain error:", blockchainError.message);
        // Continue with database save even if blockchain fails
      }
    }

    // Transform user for response
    const userResponse = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      walletAddress: newUser.walletAddress,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.json({ message: "Patient registered successfully", user: userResponse });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /registerDoctor - Allow independent registration
app.post("/registerDoctor", async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { name, email, walletAddress, password } = req.body;

    if (!name || !email || !walletAddress || !password) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      walletAddress,
      password: hashedPassword,
      role: "Doctor",
    });

    await newUser.save();
    console.log("Doctor registered in database:", newUser._id);

    // Only call blockchain if contract is available
    if (ehrContract) {
      try {
        const tx = await ehrContract.addDoctor(walletAddress);
        await tx.wait();
        console.log("Doctor added to blockchain");
      } catch (blockchainError) {
        console.error("Blockchain error:", blockchainError.message);
        // Continue with database save even if blockchain fails
      }
    }

    // Transform user for response
    const userResponse = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      walletAddress: newUser.walletAddress,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.json({ message: "Doctor registered successfully", user: userResponse });
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin registration is disabled - only predefined admin exists
app.post("/registerAdmin", async (req, res) => {
  res.status(403).json({ error: "Admin registration is disabled. Only predefined admin accounts exist." });
});

// POST /login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check for predefined admin first
    if (email === process.env.ADMIN_EMAIL) {
      if (password === process.env.ADMIN_PASSWORD) {
        const payload = {
          userId: "admin",
          email: process.env.ADMIN_EMAIL,
          role: "Admin",
          walletAddress: process.env.ADMIN_WALLET_ADDRESS,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: "admin",
            name: process.env.ADMIN_NAME || "System Administrator",
            email: process.env.ADMIN_EMAIL,
            role: "Admin",
            walletAddress: process.env.ADMIN_WALLET_ADDRESS,
          },
        });
      } else {
        return res.status(401).json({ error: "Invalid email or password" });
      }
    }

    // Check if MongoDB is connected for regular users
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /uploadRecord
app.post("/uploadRecord", authenticateJWT, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { patientAddress, fileHash, fileName, description, date } = req.body;

    if (!patientAddress || !fileHash || !fileName || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify the authenticated user matches the patient address
    const authenticatedUser = req.user;
    if (authenticatedUser.role !== "Patient" || authenticatedUser.walletAddress !== patientAddress) {
      return res.status(403).json({ error: "You can only upload records for your own wallet address" });
    }

    const patient = await User.findOne({ walletAddress: patientAddress, role: "Patient" });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Store document in database
    const newDocument = new Document({
      patientAddress,
      fileHash,
      fileName,
      description: description || "",
      date: new Date(date),
      uploadedBy: authenticatedUser.walletAddress,
    });

    await newDocument.save();
    console.log("Document saved to database:", newDocument._id);

    // Only call blockchain if contract is available
    if (ehrContract) {
      try {
        const tx = await ehrContract.uploadRecord(fileHash, fileName, date);
        await tx.wait();
        console.log("Record uploaded to blockchain");
      } catch (blockchainError) {
        console.error("Blockchain error:", blockchainError.message);
        // Continue with database save even if blockchain fails
      }
    }

    res.json({ message: "Record uploaded successfully" });
  } catch (error) {
    console.error("Upload record error:", error);
    res.status(500).json({ error: error.message });
  }
});
// POST /addNotes - Add or update doctor's notes for a document
app.post("/addNotes", async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { recordId, notes } = req.body;
    if (!recordId) {
      return res.status(400).json({ error: "Missing recordId" });
    }

    // Find and update the document
    const updatedDoc = await Document.findByIdAndUpdate(
      recordId,
      { $set: { doctorNote: notes } },
      { new: true }
    );
    if (!updatedDoc) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json({ message: "Notes updated successfully", document: updatedDoc });
  } catch (error) {
    console.error("Add notes error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /users - Get all users (Admin only)
app.get("/users", authenticateJWT, authorizeRoles("Admin"), async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const users = await User.find({}, { password: 0 }); // Exclude password
    
    // Transform _id to id for frontend compatibility
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.json({ users: transformedUsers });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /users/:userId - Remove user (Admin only)
app.delete("/users/:userId", authenticateJWT, authorizeRoles("Admin"), async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const userId = req.params.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user.role === "Admin" && user._id.toString() === req.user.userId) {
      return res.status(403).json({ error: "Cannot delete your own admin account" });
    }

    await User.findByIdAndDelete(userId);
    
    // Also remove associated documents if it's a patient
    if (user.role === "Patient") {
      await Document.deleteMany({ patientAddress: user.walletAddress });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /users/:userId - Update user role (Admin only) or profile (self-update)
app.put("/users/:userId", authenticateJWT, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const userId = req.params.userId;
    const { role, name, email, walletAddress } = req.body;
    const requestingUser = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if this is a role update (Admin only) or profile update (self or admin)
    if (role) {
      // Role update - Admin only
      if (requestingUser.role !== "Admin") {
        return res.status(403).json({ error: "Only admins can change user roles" });
      }

      if (!["Patient", "Doctor", "Admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be Patient, Doctor, or Admin" });
      }

      // Prevent admin from changing their own role
      if (user._id.toString() === requestingUser.userId) {
        return res.status(403).json({ error: "Cannot change your own role" });
      }

      user.role = role;
      await user.save();

      // Transform user for response
      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return res.json({ message: "User role updated successfully", user: userResponse });
    } else {
      // Profile update - user can update their own profile, or admin can update any profile
      const canUpdate = user._id.toString() === requestingUser.userId || requestingUser.role === "Admin";
      
      if (!canUpdate) {
        return res.status(403).json({ error: "You can only update your own profile" });
      }

      // Update profile fields
      if (name) user.name = name;
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({ email: email, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({ error: "Email is already taken by another user" });
        }
        user.email = email;
      }
      if (walletAddress) {
        // Check if wallet address is already taken by another user
        const existingUser = await User.findOne({ walletAddress: walletAddress, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({ error: "Wallet address is already taken by another user" });
        }
        user.walletAddress = walletAddress;
      }

      await user.save();

      // Transform user for response
      const userResponse = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return res.json({ message: "Profile updated successfully", user: userResponse });
    }
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /users/:userId/change-password - Change user password (self only)
app.put("/users/:userId/change-password", authenticateJWT, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body;
    const requestingUser = req.user;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Users can only change their own password
    if (user._id.toString() !== requestingUser.userId) {
      return res.status(403).json({ error: "You can only change your own password" });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /appointments - Create new appointment (Patient only)
app.post("/appointments", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { doctorId, healthProblem, appointmentDate, attachedFiles, priority } = req.body;
    const patientUser = req.user;

    if (patientUser.role !== "Patient") {
      return res.status(403).json({ error: "Only patients can create appointments" });
    }

    if (!doctorId || !healthProblem || !appointmentDate) {
      return res.status(400).json({ error: "Doctor, health problem, and appointment date are required" });
    }

    // Verify doctor exists and is a doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "Doctor") {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Verify appointment date is in the future
    const appointmentDateObj = new Date(appointmentDate);
    if (appointmentDateObj <= new Date()) {
      return res.status(400).json({ error: "Appointment date must be in the future" });
    }

    const newAppointment = new Appointment({
      patientId: patientUser.userId,
      doctorId: doctorId,
      patientWalletAddress: patientUser.walletAddress,
      doctorWalletAddress: doctor.walletAddress,
      healthProblem: healthProblem,
      appointmentDate: appointmentDateObj,
      attachedFiles: attachedFiles || [],
      priority: priority || "medium"
    });

    await newAppointment.save();

    // Populate doctor info for response
    await newAppointment.populate('doctorId', 'name email');

    res.json({ 
      message: "Appointment scheduled successfully", 
      appointment: newAppointment 
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /appointments - Get appointments (Patient gets their appointments, Doctor gets appointments assigned to them)
app.get("/appointments", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const user = req.user;
    let query = {};

    if (user.role === "Patient") {
      query.patientId = user.userId;
    } else if (user.role === "Doctor") {
      query.doctorId = user.userId;
    } else if (user.role === "Admin") {
      // Admin can see all appointments
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email walletAddress')
      .populate('doctorId', 'name email walletAddress')
      .sort({ createdAt: -1 });

    res.json({ appointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /appointments/:appointmentId/status - Update appointment status (Doctor only)
app.put("/appointments/:appointmentId/status", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const appointmentId = req.params.appointmentId;
    const { status } = req.body;
    const user = req.user;

    if (user.role !== "Doctor") {
      return res.status(403).json({ error: "Only doctors can update appointment status" });
    }

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.doctorId.toString() !== user.userId) {
      return res.status(403).json({ error: "You can only update your own appointments" });
    }

    appointment.status = status;
    await appointment.save();

    await appointment.populate('patientId', 'name email walletAddress');
    await appointment.populate('doctorId', 'name email walletAddress');

    res.json({ 
      message: "Appointment status updated successfully", 
      appointment 
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /appointments/:appointmentId/response - Add doctor response (Doctor only)
app.put("/appointments/:appointmentId/response", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const appointmentId = req.params.appointmentId;
    const { doctorNotes, doctorMessage } = req.body;
    const user = req.user;

    if (user.role !== "Doctor") {
      return res.status(403).json({ error: "Only doctors can add responses" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    if (appointment.doctorId.toString() !== user.userId) {
      return res.status(403).json({ error: "You can only respond to your own appointments" });
    }

    if (doctorNotes) appointment.doctorNotes = doctorNotes;
    if (doctorMessage) appointment.doctorMessage = doctorMessage;
    appointment.doctorResponseDate = new Date();
    
    await appointment.save();

    await appointment.populate('patientId', 'name email walletAddress');
    await appointment.populate('doctorId', 'name email walletAddress');

    res.json({ 
      message: "Doctor response added successfully", 
      appointment 
    });
  } catch (error) {
    console.error("Add doctor response error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /doctors - Get all doctors (for appointment scheduling)
app.get("/doctors", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const doctors = await User.find({ role: "Doctor" }, { password: 0 })
      .sort({ name: 1 });

    // Transform _id to id for frontend compatibility
    const transformedDoctors = doctors.map(doctor => ({
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      walletAddress: doctor.walletAddress,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    }));

    res.json({ doctors: transformedDoctors });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /dashboard/stats - Get dashboard statistics (Admin only)
app.get("/dashboard/stats", authenticateJWT, authorizeRoles("Admin"), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    // Calculate stats from actual data
    const totalPatients = await User.countDocuments({ role: "Patient" });
    const totalDoctors = await User.countDocuments({ role: "Doctor" });
    
    // Calculate new members this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newMembersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth },
      role: { $in: ["Patient", "Doctor"] }
    });

    // Additional stats that might be useful
    const totalAppointments = await Appointment.countDocuments();
    const totalRecords = await Document.countDocuments();
    
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const confirmedAppointments = await Appointment.countDocuments({ status: "confirmed" });
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });

    const stats = {
      totalPatients,
      totalDoctors,
      newMembersThisMonth,
      totalAppointments,
      totalRecords,
      appointmentStats: {
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments
      }
    };

    res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /records - Get patient's own records (Patient only)
app.get("/records", authenticateJWT, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const user = req.user;
    if (user.role !== "Patient") {
      return res.status(403).json({ error: "Only patients can access their own records" });
    }

    console.log("Fetching records for patient:", user.walletAddress);

    // Get documents from database
    const documents = await Document.find({ patientAddress: user.walletAddress }).sort({ date: -1 });
    console.log("Documents from database:", documents.length);

    res.json({ records: documents });
  } catch (error) {
    console.error("Get records error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /records/:patientId - Get specific patient's records (Doctor only)
app.get("/records/:patientId", authenticateJWT, async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const user = req.user;
    const patientId = req.params.patientId;
    
    // Only doctors and admins can access other patients' records
    if (user.role !== "Doctor" && user.role !== "Admin") {
      return res.status(403).json({ error: "Only doctors and admins can access patient records" });
    }

    console.log("Fetching records for patient:", patientId);

    const patient = await User.findOne({ walletAddress: patientId, role: "Patient" });
    if (!patient) {
      console.log("Patient not found for wallet:", patientId);
      return res.status(404).json({ error: "Patient not found" });
    }

    console.log("Patient found:", patient.name);

    // Get documents from database
    const documents = await Document.find({ patientAddress: patientId }).sort({ date: -1 });
    console.log("Documents from database:", documents.length);

    res.json({ 
      records: documents,
      patient: {
        name: patient.name,
        email: patient.email,
        walletAddress: patient.walletAddress
      }
    });
  } catch (error) {
    console.error("Get records error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /appointments/:appointmentId/patient-records - Get patient's medical records for a specific appointment (Doctor only)
app.get("/appointments/:appointmentId/patient-records", authenticateJWT, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const user = req.user;
    const appointmentId = req.params.appointmentId;

    if (user.role !== "Doctor" && user.role !== "Admin") {
      return res.status(403).json({ error: "Only doctors and admins can access patient records" });
    }

    // Get the appointment and verify the doctor has access
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email walletAddress')
      .populate('doctorId', 'name email walletAddress');

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Verify the doctor has access to this appointment
    if (user.role === "Doctor" && appointment.doctorId._id.toString() !== user.userId) {
      return res.status(403).json({ error: "You can only access records for your own appointments" });
    }

    // Get patient's medical records
    const documents = await Document.find({ 
      patientAddress: appointment.patientId.walletAddress 
    }).sort({ date: -1 });

    res.json({ 
      records: documents,
      patient: {
        name: appointment.patientId.name,
        email: appointment.patientId.email,
        walletAddress: appointment.patientId.walletAddress
      },
      appointment: {
        id: appointment._id,
        healthProblem: appointment.healthProblem,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
        priority: appointment.priority
      }
    });
  } catch (error) {
    console.error("Get patient records for appointment error:", error);
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post("/upload-file", authenticateJWT, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileData = {
      fileName: req.file.originalname,
      fileHash: req.file.filename, // Use the generated filename as hash
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.userId,
      uploadDate: new Date()
    };

    res.json({
      success: true,
      file: {
        fileName: fileData.fileName,
        fileHash: fileData.fileHash,
        uploadDate: fileData.uploadDate
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// File retrieval endpoint
app.get("/file/:fileHash", authenticateJWT, (req, res) => {
  try {
    const { fileHash } = req.params;
    
    // Check if this is a mock hash from old system
    if (fileHash.startsWith('QmMockHash')) {
      // Create a placeholder image for old mock files
      const fileName = fileHash.split('_').pop() || 'unknown.png';
      const isImage = fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
      
      if (isImage) {
        // Create a simple SVG placeholder
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e40af;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad1)" />
  <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="20">Medical Document</text>
  <text x="200" y="160" text-anchor="middle" fill="white" font-family="Arial" font-size="16">${fileName}</text>
  <text x="200" y="190" text-anchor="middle" fill="white" font-family="Arial" font-size="12">Legacy File</text>
  <text x="200" y="210" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Please re-upload for full functionality</text>
</svg>`;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        return res.send(svgContent);
      } else {
        // For non-images, return a text placeholder
        const textContent = `Legacy Medical Document\n\nFile: ${fileName}\nOriginal Hash: ${fileHash}\n\nThis file was uploaded using the previous system.\nPlease re-upload this file to view the original content.`;
        res.setHeader('Content-Type', 'text/plain');
        return res.send(textContent);
      }
    }
    
    // Handle real files
    const filePath = path.join(uploadsDir, fileHash);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // Set appropriate headers
    res.setHeader('Content-Length', fileSize);
    
    // Determine content type based on file extension
    const ext = path.extname(fileHash).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("File retrieval error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});