import axios from 'axios'
import { User, MedicalRecord, Appointment, DashboardStats, AuthResponse, ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/login', { email, password })
    return response.data
  },

  register: async (userData: {
    name: string
    email: string
    password: string
    walletAddress: string
    role: 'Doctor' | 'Patient'
  }): Promise<AuthResponse> => {
    const endpoint = userData.role === 'Patient' ? '/registerPatient' : '/registerDoctor'
    const response = await api.post(endpoint, userData)
    return response.data
  },
}

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/users')
    return response.data.users || []
  },

  delete: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`)
  },

  updateRole: async (userId: string, role: string): Promise<void> => {
    await api.put(`/users/${userId}`, { role })
  },

  updateProfile: async (userId: string, name: string, email: string): Promise<User> => {
    const response = await api.put(`/users/${userId}`, { name, email })
    return response.data.user
  },
}

// Medical Records API
export const recordsApi = {
  getAll: async (): Promise<MedicalRecord[]> => {
    const response = await api.get('/records')
    return response.data.records || []
  },

  upload: async (file: File, description?: string): Promise<MedicalRecord> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const uploadResponse = await api.post('/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    
    if (uploadResponse.data.success) {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const recordData = {
        patientAddress: user.walletAddress,
        fileHash: uploadResponse.data.file.fileHash,
        fileName: uploadResponse.data.file.fileName,
        description,
        date: new Date().toISOString()
      }
      
      const response = await api.post('/uploadRecord', recordData)
      return response.data
    }
    
    throw new Error('Upload failed')
  },
}

// Appointments API
export const appointmentsApi = {
  getAll: async (): Promise<Appointment[]> => {
    const response = await api.get('/appointments')
    return response.data.appointments || []
  },

  create: async (appointmentData: {
    doctorId: string
    appointmentDate: string
    healthProblem: string
    priority: string
    attachedFiles?: { fileName: string; fileHash: string }[]
  }): Promise<Appointment> => {
    const response = await api.post('/appointments', appointmentData)
    return response.data
  },

  updateStatus: async (appointmentId: string, status: string): Promise<void> => {
    await api.put(`/appointments/${appointmentId}/status`, { status })
  },

  sendResponse: async (appointmentId: string, responseData: {
    doctorMessage?: string
    doctorNotes?: string
  }): Promise<void> => {
    await api.put(`/appointments/${appointmentId}/response`, responseData)
  },

  getPatientRecords: async (appointmentId: string): Promise<{
    records: MedicalRecord[]
    patient: User
  }> => {
    const response = await api.get(`/appointments/${appointmentId}/patient-records`)
    return response.data
  },
}

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },
}

// Doctors API
export const doctorsApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get('/doctors')
    return response.data.doctors || []
  },
}

// File API
export const fileApi = {
  getFile: async (fileHash: string): Promise<string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const response = await fetch(`${API_BASE_URL}/file/${fileHash}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('File not found or access denied')
    }
    
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  },
}

export default api
