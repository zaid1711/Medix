'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, MessageSquare, Eye, Download, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { Appointment, MedicalRecord, User } from '@/types'
import { appointmentsApi, fileApi } from '@/lib/api'
import { cn, formatDate, getStatusColor, getPriorityIcon } from '@/lib/utils'

// Helper function to get the correct appointment ID
const getAppointmentId = (appointment: any): string => {
  return appointment._id || appointment.id || ''
}

export function DoctorDashboard() {
  const { showToast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showPatientRecords, setShowPatientRecords] = useState(false)
  const [patientRecords, setPatientRecords] = useState<MedicalRecord[]>([])
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null)
  const [viewingFile, setViewingFile] = useState<{ url: string; fileName: string } | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const appointmentsData = await appointmentsApi.getAll()
      console.log('Fetched appointments data:', appointmentsData)
      console.log('First appointment structure:', appointmentsData[0])
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPatientRecords = async (appointmentId: string) => {
    try {
      setLoading(true)
      const data = await appointmentsApi.getPatientRecords(appointmentId)
      setPatientRecords(data.records)
      setSelectedPatient(data.patient)
      setShowPatientRecords(true)
    } catch (error: any) {
      console.error('Error fetching patient records:', error)
      showToast('error', 'Failed to Load Records', 'Unable to load patient records. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendResponse = async (appointmentId: string, responseData: {
    doctorMessage?: string
    doctorNotes?: string
  }) => {
    try {
      console.log('Full appointment object:', selectedAppointment)
      console.log('Sending response:', { appointmentId, responseData })
      
      // Ensure we have a valid appointment ID
      if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
        console.error('Invalid appointment ID detected:', appointmentId)
        throw new Error('Invalid appointment ID. Please refresh the page and try again.')
      }

      // Show loading toast
      showToast('info', 'Sending Response...', 'Please wait while we send your message to the patient.', 2000)
      
      await appointmentsApi.sendResponse(appointmentId, responseData)
      console.log('Response sent successfully')
      await fetchAppointments()
      setShowResponseModal(false)
      setSelectedAppointment(null)
      showToast('success', 'Response Sent Successfully!', 'Your message has been delivered to the patient.')
    } catch (error: any) {
      console.error('Error sending response:', error)
      console.error('Error details:', error.response?.data)
      showToast('error', 'Failed to Send Response', error.response?.data?.error || error.message)
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, 'completed')
      await fetchAppointments()
      showToast('success', 'Appointment Completed!', 'The appointment has been marked as completed successfully.')
    } catch (error: any) {
      console.error('Error completing appointment:', error)
      showToast('error', 'Failed to Complete', 'Unable to mark appointment as completed. Please try again.')
    }
  }

  const handleUpdateStatus = async (appointmentId: string, status: string) => {
    try {
      await appointmentsApi.updateStatus(appointmentId, status)
      await fetchAppointments()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleViewAttachedFile = async (file: { fileName: string; fileHash: string }) => {
    try {
      const fileUrl = await fileApi.getFile(file.fileHash)
      setViewingFile({ url: fileUrl, fileName: file.fileName })
    } catch (error: any) {
      console.error('Error viewing file:', error)
      showToast('error', 'Failed to Open File', 'Unable to open the selected file. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage patient appointments and view medical records</p>
      </div>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Appointments</CardTitle>
          <CardDescription>
            Review and respond to patient appointment requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
              <p className="text-gray-600">Patient appointments will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={getAppointmentId(appointment)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">{getPriorityIcon(appointment.priority)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">
                            Patient: {appointment.patientId.name}
                          </h3>
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full border",
                            getStatusColor(appointment.status)
                          )}>
                            {appointment.status}
                          </span>
                          <span className="text-xs text-gray-500 uppercase">
                            {appointment.priority} Priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {formatDate(appointment.appointmentDate)}
                        </p>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            Patient&apos;s Health Problem:
                          </h4>
                          <p className="text-sm text-gray-700">{appointment.healthProblem}</p>
                        </div>

                        {/* Attached Files */}
                        {appointment.attachedFiles && appointment.attachedFiles.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Attached Files ({appointment.attachedFiles.length}):
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {appointment.attachedFiles.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleViewAttachedFile(file)}
                                  className="inline-flex items-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs rounded border border-blue-200 transition-colors cursor-pointer"
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  {file.fileName}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Doctor Response */}
                        {(appointment.doctorMessage || appointment.doctorNotes) && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Your Previous Response</span>
                            </div>
                            {appointment.doctorMessage && (
                              <div className="mb-2">
                                <span className="text-sm font-medium text-green-700">Message:</span>
                                <p className="text-sm text-green-700 mt-1">{appointment.doctorMessage}</p>
                              </div>
                            )}
                            {appointment.doctorNotes && (
                              <div>
                                <span className="text-sm font-medium text-green-700">Medical Notes:</span>
                                <p className="text-sm text-green-700 mt-1">{appointment.doctorNotes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPatientRecords(getAppointmentId(appointment))}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Records
                      </Button>
                      {appointment.status !== 'completed' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              const appointmentId = getAppointmentId(appointment)
                              console.log('Opening response modal for appointment:', appointmentId, appointment)
                              if (appointmentId) {
                                setSelectedAppointment(appointment)
                                setShowResponseModal(true)
                              } else {
                                showToast('error', 'Invalid Appointment', 'Unable to find appointment ID. Please refresh the page.')
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Respond
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            onClick={() => handleCompleteAppointment(getAppointmentId(appointment))}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Complete
                          </Button>
                        </>
                      )}
                      {appointment.status === 'completed' && (
                        <div className="text-center py-2">
                          <span className="text-sm text-green-600 font-medium">
                            ✅ Completed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Modal */}
      {showResponseModal && selectedAppointment && (
        <ResponseModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowResponseModal(false)
            setSelectedAppointment(null)
          }}
          onSend={handleSendResponse}
        />
      )}

      {/* Patient Records Modal */}
      {showPatientRecords && selectedPatient && (
        <PatientRecordsModal
          patient={selectedPatient}
          records={patientRecords}
          showToast={showToast}
          onClose={() => {
            setShowPatientRecords(false)
            setPatientRecords([])
            setSelectedPatient(null)
          }}
        />
      )}

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{viewingFile.fileName}</h3>
                <Button variant="ghost" size="icon" onClick={() => setViewingFile(null)}>
                  ×
                </Button>
              </div>
              <div className="flex justify-center">
                {viewingFile.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-[70vh] border border-gray-300 rounded"
                    title={viewingFile.fileName}
                  />
                ) : viewingFile.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = viewingFile.url
                        link.download = viewingFile.fileName
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Response Modal Component
function ResponseModal({ 
  appointment, 
  onClose, 
  onSend 
}: { 
  appointment: Appointment
  onClose: () => void
  onSend: (appointmentId: string, responseData: { doctorMessage?: string; doctorNotes?: string }) => Promise<void>
}) {
  const [doctorMessage, setDoctorMessage] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (doctorMessage.trim() && !isSubmitting) {
      setIsSubmitting(true)
      try {
        const appointmentId = appointment._id || appointment.id
        console.log('Using appointment ID:', appointmentId)
        await onSend(appointmentId, { 
          doctorMessage: doctorMessage.trim(), 
          doctorNotes: doctorNotes.trim() || undefined 
        })
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Send Response to Patient</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          </div>
          
          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{appointment.patientId.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{appointment.patientId.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">{formatDate(appointment.appointmentDate)}</span>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <span className="ml-2 font-medium capitalize">{appointment.priority}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="text-gray-600 text-sm">Health Problem:</span>
              <p className="text-sm text-gray-900 mt-1 bg-white p-2 rounded border">
                {appointment.healthProblem}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Patient *
              </label>
              <textarea
                value={doctorMessage}
                onChange={(e) => setDoctorMessage(e.target.value)}
                placeholder="Enter your message to the patient..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24 resize-none"
                required
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {doctorMessage.length}/1000 characters
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical Notes (Optional)
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Enter detailed medical notes..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 h-32 resize-none"
                maxLength={2000}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {doctorNotes.length}/2000 characters
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!doctorMessage.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Response
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Patient Records Modal Component
function PatientRecordsModal({ 
  patient, 
  records, 
  onClose,
  showToast
}: { 
  patient: User
  records: MedicalRecord[]
  onClose: () => void
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void
}) {
  const [viewingFile, setViewingFile] = useState<{ url: string; fileName: string } | null>(null)

  const handleViewFile = async (record: MedicalRecord) => {
    try {
      const fileUrl = await fileApi.getFile(record.fileHash)
      setViewingFile({ url: fileUrl, fileName: record.fileName })
    } catch (error: any) {
      console.error('Error viewing file:', error)
      showToast('error', 'Failed to Open File', 'Unable to open the selected file. Please try again.')
    }
  }

  const handleDownloadFile = async (record: MedicalRecord) => {
    try {
      const fileUrl = await fileApi.getFile(record.fileHash)
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = record.fileName
      link.click()
    } catch (error: any) {
      console.error('Error downloading file:', error)
      showToast('error', 'Download Failed', 'Unable to download the file. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {patient.name}&apos;s Medical History
              </h2>
              <p className="text-sm text-gray-600">
                {records.length} medical record{records.length !== 1 ? 's' : ''} found • Most recent first
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              ×
            </Button>
          </div>
          
          {records.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-600">This patient hasn&apos;t uploaded any medical documents yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => {
                const isRecent = new Date(record.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                return (
                  <div
                    key={record.id}
                    className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                      isRecent 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{record.fileName}</h3>
                          {isRecent && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              Recent
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                        {record.description && (
                          <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                        )}
                        {record.doctorNote && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <MessageSquare className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">Previous Doctor&apos;s Notes</span>
                            </div>
                            <p className="text-sm text-green-700">{record.doctorNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewFile(record)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadFile(record)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{viewingFile.fileName}</h3>
                <Button variant="ghost" size="icon" onClick={() => setViewingFile(null)}>
                  ×
                </Button>
              </div>
              <div className="flex justify-center">
                {viewingFile.fileName.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-[70vh] border border-gray-300 rounded"
                    title={viewingFile.fileName}
                  />
                ) : viewingFile.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={viewingFile.url}
                    alt={viewingFile.fileName}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = viewingFile.url
                        link.download = viewingFile.fileName
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
