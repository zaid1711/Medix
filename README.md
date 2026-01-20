# EHR (Electronic Health Records) System

A comprehensive Electronic Health Records system with blockchain integration, featuring multi-role authentication, document management, and smart contract functionality.

## 🚀 Project Overview

This is a full-stack EHR system that includes:

- **Frontend**: React.js application with Material-UI components
- **Backend**: Node.js/Express server with JWT authentication
- **Database**: MongoDB Atlas for data persistence
- **Blockchain**: Ethereum smart contracts (Hardhat) for secure record management
- **Multi-Role System**: Patient, Doctor, and Admin roles with independent registration

### Key Features

- ✅ **Multi-role Authentication** (Patient, Doctor, Admin)
- ✅ **Document Upload** (with IPFS integration)
- ✅ **Role-based Access Control**
- ✅ **User Management** (Admin dashboard)
- ✅ **Medical Records Management**
- ✅ **Blockchain Integration** (Ethereum smart contracts)
- ✅ **Modern UI** (Material-UI components)
- ✅ **Independent Registration** for all roles

## 📋 Prerequisites

Make sure you have installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **Git**
- **MongoDB Atlas account** (free tier available)

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

```bash
# Install main project dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the **backend** directory with the following variables:

```bash
# MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ehr?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Blockchain Configuration (Optional - for development)
RPC_URL=http://localhost:8545
PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=your_contract_address_here

# Server Port
PORT=3001
```

### Step 3: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `<username>`, `<password>`, and `<cluster>` in the MONGO_URI

### Step 4: Deploy Smart Contracts (Optional)

If you want to use blockchain features:

```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address to your `.env` file.

## 🚀 Running the Application

### Option A: Run Everything Together (Recommended)

```bash
# This runs both backend and frontend simultaneously
npm run dev
```

### Option B: Run Separately

```bash
# Terminal 1 - Backend
npm run start:backend

# Terminal 2 - Frontend  
npm run start:frontend
```

### Option C: Manual Start

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Access the Application

Once running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🧪 Testing the Application

1. **Register**: Create accounts for different roles (Patient, Doctor, Admin)
2. **Login**: Sign in with your credentials
3. **Upload Documents**: Patients can upload medical documents
4. **View Records**: Doctors can view and add notes to patient records
5. **Manage Users**: Admins can manage all users in the system

## 📜 Available Scripts

```bash
# Run tests
npm test

# Compile smart contracts
npm run compile

# Deploy contracts
npm run deploy

# Start backend only
npm run start:backend

# Start frontend only
npm run start:frontend

# Start both (development mode)
npm run dev
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**: Check your MONGO_URI in the `.env` file
2. **Port Already in Use**: Make sure ports 3000 and 3001 are available
3. **Dependencies Issues**: Delete `node_modules` and run `npm install` again
4. **CORS Errors**: The backend is configured to allow requests from `http://localhost:3000`

### If you encounter errors:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..

# For backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

## 🏗️ Project Structure

```
EHR/
├── backend/                 # Node.js/Express backend
│   ├── middleware/          # Authentication middleware
│   ├── models/             # MongoDB models
│   └── server.js           # Main server file
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── utils/          # API utilities
│   └── public/             # Static assets
├── contracts/              # Solidity smart contracts
├── scripts/                # Deployment scripts
└── test/                   # Test files
```

## 🔐 User Roles & Permissions

### Patient
- Register independently
- Upload medical documents
- View own medical records
- Access patient dashboard

### Doctor
- Register independently
- View patient medical records
- Add notes to patient records
- Access doctor dashboard

### Admin
- Register independently
- Manage all users (add, remove, update roles)
- View all system data
- Access admin dashboard

## 🧪 Testing Smart Contracts

```bash
# Run all tests
npx hardhat test

# Run Solidity tests only
npx hardhat test solidity

# Run TypeScript tests only
npx hardhat test mocha
```

## 📱 API Endpoints

### Authentication
- `POST /registerPatient` - Register a new patient
- `POST /registerDoctor` - Register a new doctor
- `POST /registerAdmin` - ~~Register a new admin~~ **DISABLED - Admin credentials are predefined in environment variables**
- `POST /login` - User login (includes predefined admin login)

### Records Management
- `POST /uploadRecord` - Upload medical document (Patient only)
- `GET /records/:patientId` - Get patient records
- `POST /addNotes` - Add doctor notes to records

### User Management (Admin only)
- `GET /users` - Get all users
- `DELETE /users/:userId` - Remove user
- `PUT /users/:userId` - Update user role

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the error logs in the console
3. Ensure all dependencies are properly installed
4. Verify your environment variables are correctly set

---

**Happy coding! 🎉**
