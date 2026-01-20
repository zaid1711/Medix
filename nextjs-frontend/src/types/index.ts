export interface User {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Doctor' | 'Patient'
  walletAddress: string
  createdAt?: string
  updatedAt?: string
}

export interface MedicalRecord {
  id: string
  fileName: string
  fileHash: string
  description?: string
  date: string
  doctorNote?: string
  patientAddress: string
}

export interface Appointment {
  id: string
  _id?: string  // MongoDB ObjectId
  patientId: {
    id: string
    _id?: string
    name: string
    email: string
  }
  doctorId: {
    id: string
    _id?: string
    name: string
    email: string
  }
  appointmentDate: string
  healthProblem: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  attachedFiles?: {
    fileName: string
    fileHash: string
  }[]
  doctorMessage?: string
  doctorNotes?: string
  responseDate?: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalPatients: number
  totalDoctors: number
  newMembersThisMonth: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
