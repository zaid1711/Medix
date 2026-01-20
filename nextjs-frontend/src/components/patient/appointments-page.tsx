'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, MessageSquare, Eye, Download, Clock, CheckCircle, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Appointment, User as UserType } from '@/types'
import { appointmentsApi, doctorsApi } from '@/lib/api'
import { cn, formatDate, getStatusColor, getPriorityIcon } from '@/lib/utils'
import { EnhancedDropdown } from '@/components/ui/enhanced-dropdown'

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
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
    fetchAppointments()
  }, [router])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const appointmentsData = await appointmentsApi.getAll()
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToDashboard = () => {
    if (user?.role === 'Patient') {
      router.push('/patient')
    } else if (user?.role === 'Doctor') {
      router.push('/doctor')
    } else if (user?.role === 'Admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    router.push('/login')
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
    <div className="min-h-screen bg-gray-50">
      {/* Liquid Navbar */}
      <nav className="liquid-navbar sticky top-0 z-30 w-full">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Back button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>

          {/* Right side - Profile dropdown */}
          <div className="flex items-center space-x-4">
            <EnhancedDropdown user={user} onLogout={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-600">View and manage your scheduled appointments</p>
        </div>

        {/* Appointments Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Scheduled Appointments ({appointments.length})</span>
                </CardTitle>
                <CardDescription>
                  Your appointments with doctors
                </CardDescription>
              </div>
              <Button onClick={() => setShowScheduleModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No appointments scheduled</h3>
                <p className="text-gray-600 mb-6">Schedule your first appointment with a doctor</p>
                <Button onClick={() => setShowScheduleModal(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-xl">{getPriorityIcon(appointment.priority)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-medium text-gray-900 text-lg">
                              Dr. {appointment.doctorId.name}
                            </h3>
                            <span className={cn(
                              "px-3 py-1 text-sm font-medium rounded-full border",
                              getStatusColor(appointment.status)
                            )}>
                              {appointment.status}
                            </span>
                            <span className="text-sm text-gray-500 uppercase">
                              {appointment.priority} Priority
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">
                            📅 {formatDate(appointment.appointmentDate)}
                          </p>
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Your Health Problem:
                            </h4>
                            <p className="text-sm text-gray-700">{appointment.healthProblem}</p>
                          </div>
                          
                          {/* Doctor Response */}
                          {(appointment.doctorMessage || appointment.doctorNotes) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-3">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Doctor&apos;s Response</span>
                              </div>
                              {appointment.doctorMessage && (
                                <div className="mb-3">
                                  <span className="text-sm font-medium text-blue-700">Message:</span>
                                  <p className="text-sm text-blue-700 mt-1">{appointment.doctorMessage}</p>
                                </div>
                              )}
                              {appointment.doctorNotes && (
                                <div>
                                  <span className="text-sm font-medium text-blue-700">Medical Notes:</span>
                                  <p className="text-sm text-blue-700 mt-1">{appointment.doctorNotes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          onClose={() => setShowScheduleModal(false)}
          onSchedule={() => {
            setShowScheduleModal(false)
            fetchAppointments()
          }}
        />
      )}
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [doctors, setDoctors] = useState<UserType[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(true)

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true)
        const doctorsData = await doctorsApi.getAll()
        setDoctors(doctorsData)
      } catch (error) {
        console.error('Error fetching doctors:', error)
        setError('Failed to load doctors list. Please try again.')
      } finally {
        setLoadingDoctors(false)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Limit to 5 files and 10MB each
      const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024)
      if (validFiles.length !== files.length) {
        setError('Some files were too large (max 10MB each) and were not added.')
      }
      setUploadedFiles(prev => [...prev, ...validFiles].slice(0, 5))
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
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
      // Create the appointment using the API
      const appointmentDateTime = `${formData.appointmentDate}T${formData.appointmentTime}:00.000Z`
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('doctorId', formData.doctorId)
      formDataToSend.append('appointmentDate', appointmentDateTime.toString())
      formDataToSend.append('healthProblem', formData.healthProblem)
      formDataToSend.append('priority', formData.priority)
      
      // Append files
      uploadedFiles.forEach((file, index) => {
        formDataToSend.append(`files`, file)
      })

      await appointmentsApi.create({
        doctorId: formData.doctorId,
        appointmentDate: appointmentDateTime,
        healthProblem: formData.healthProblem,
        priority: formData.priority,
        attachedFiles: uploadedFiles.map(file => ({
          fileName: file.name,
          fileHash: crypto.randomUUID() // Generate a unique hash for each file
        }))
      })
      
      setSuccess('Appointment scheduled successfully!')
      setTimeout(() => {
        onSchedule()
      }, 1500)
    } catch (error: any) {
      console.error('Error scheduling appointment:', error)
      setError(error.response?.data?.error || 'Failed to schedule appointment. Please try again.')
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
              {loadingDoctors ? (
                <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-600">Loading doctors...</span>
                </div>
              ) : (
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={doctors.length === 0}
                >
                  <option value="">
                    {doctors.length === 0 ? 'No doctors available' : 'Choose a doctor...'}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.email}
                    </option>
                  ))}
                </select>
              )}
              {doctors.length === 0 && !loadingDoctors && (
                <p className="text-sm text-gray-500 mt-1">
                  No doctors are currently registered in the system.
                </p>
              )}
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

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Medical Documents (Optional)
              </label>
              <div className="space-y-3">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, JPG, PNG, DOC (max 10MB each, up to 5 files)
                    </span>
                  </label>
                </div>

                {/* Display uploaded files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
