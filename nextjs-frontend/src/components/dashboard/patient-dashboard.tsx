'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Calendar, Upload, Plus, Eye, Download, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MedicalRecord, Appointment, User as UserType } from '@/types'
import { recordsApi, appointmentsApi, usersApi } from '@/lib/api'
import { cn, formatDate, getStatusColor, getPriorityIcon } from '@/lib/utils'

export function PatientDashboard() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get user data
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [recordsData, appointmentsData] = await Promise.all([
        recordsApi.getAll(),
        appointmentsApi.getAll()
      ])
      setRecords(recordsData)
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, description: string) => {
    try {
      setLoading(true)
      await recordsApi.upload(file, description)
      setShowUploadModal(false)
      fetchData()
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentScheduled = async () => {
    setShowScheduleModal(false)
    fetchData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-blue-100 text-lg">
            Here&apos;s your health overview and recent activity.
          </p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medical Records Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/patient/medical-records')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span>Medical Records</span>
            </CardTitle>
            <CardDescription>
              View and manage your medical documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {records.length} Medical Records
              </h3>
              <p className="text-gray-600 mb-4">
                {records.length === 0 
                  ? "Upload your first medical document" 
                  : "View your uploaded medical files"
                }
              </p>
              <Button variant="outline" className="w-full">
                View All Records
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/patient/appointments')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <span>My Appointments</span>
            </CardTitle>
            <CardDescription>
              View and manage your appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {appointments.length} Appointments
              </h3>
              <p className="text-gray-600 mb-4">
                {appointments.length === 0 
                  ? "Schedule your first appointment" 
                  : "View your scheduled appointments"
                }
              </p>
              <Button variant="outline" className="w-full">
                View All Appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest medical records and appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recent Records */}
            {records.slice(0, 2).map((record) => (
              <div key={record.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{record.fileName}</p>
                  <p className="text-xs text-gray-500">{formatDate(record.date)}</p>
                </div>
              </div>
            ))}
            
            {/* Recent Appointments */}
            {appointments.slice(0, 2).map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Appointment with Dr. {appointment.doctorId.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(appointment.appointmentDate)}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full border",
                  getStatusColor(appointment.status)
                )}>
                  {appointment.status}
                </span>
              </div>
            ))}
            
            {records.length === 0 && appointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={() => {
            setShowScheduleModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

// Upload Modal Component
function UploadModal({ onClose, onUpload }: { onClose: () => void; onUpload: (file: File, description: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      onUpload(file, description)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Medical Record</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.txt,.doc,.docx"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this medical record..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file}>
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Schedule Modal Component
function ScheduleModal({ onClose, onSchedule }: { onClose: () => void; onSchedule: () => void }) {
  const [formData, setFormData] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    healthProblem: '',
    priority: 'medium'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [doctors, setDoctors] = useState<{ id: string; name: string; email: string }[]>([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorsLoading(true)
        const users = await usersApi.getAll()
        // Filter only doctors from the user list
        const doctorsList = users
          .filter(user => user.role === 'Doctor')
          .map(doctor => ({
            id: doctor.id,
            name: doctor.name,
            email: doctor.email
          }))
        setDoctors(doctorsList)
      } catch (error) {
        console.error('Error fetching doctors:', error)
        setError('Failed to load doctors. Please try again.')
      } finally {
        setDoctorsLoading(false)
      }
    }

    fetchDoctors()
  }, [])

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validation
    if (!formData.doctorId || !formData.appointmentDate || !formData.appointmentTime || !formData.healthProblem) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Check if date is in the future
    const selectedDate = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`)
    if (selectedDate <= new Date()) {
      setError('Please select a future date and time')
      setLoading(false)
      return
    }

    try {
      // Here you would make an API call to schedule the appointment
      // For now, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Appointment scheduled successfully!')
      setTimeout(() => {
        onSchedule()
      }, 1500)
    } catch (error) {
      setError('Failed to schedule appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6">Schedule New Appointment</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center space-x-2">
              <span className="text-green-600 text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Doctor Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor *
              </label>
              <select
                name="doctorId"
                value={formData.doctorId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={doctorsLoading}
              >
                <option value="">
                  {doctorsLoading ? 'Loading doctors...' : doctors.length === 0 ? 'No doctors available' : 'Choose a doctor...'}
                </option>
                {!doctorsLoading && doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} ({doctor.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date *
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Time *
                </label>
                <select
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select time...</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low - Routine checkup</option>
                <option value="medium">Medium - Standard consultation</option>
                <option value="high">High - Urgent but not emergency</option>
                <option value="urgent">Urgent - Requires immediate attention</option>
              </select>
            </div>

            {/* Health Problem Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe your health problem *
              </label>
              <textarea
                name="healthProblem"
                value={formData.healthProblem}
                onChange={handleChange}
                placeholder="Please describe your symptoms, concerns, or reason for the appointment..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
