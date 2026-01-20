'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, Plus, Eye, Download, MessageSquare, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MedicalRecord, User as UserType } from '@/types'
import { recordsApi, fileApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { EnhancedDropdown } from '@/components/ui/enhanced-dropdown'

export function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [viewingFile, setViewingFile] = useState<{ url: string; fileName: string } | null>(null)
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
    fetchRecords()
  }, [router])

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const recordsData = await recordsApi.getAll()
      setRecords(recordsData)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File, description: string) => {
    try {
      setLoading(true)
      await recordsApi.upload(file, description)
      await fetchRecords()
      setShowUploadModal(false)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewFile = async (record: MedicalRecord) => {
    try {
      const fileUrl = await fileApi.getFile(record.fileHash)
      setViewingFile({ url: fileUrl, fileName: record.fileName })
    } catch (error: any) {
      console.error('Error viewing file:', error)
      alert('Failed to open file. Please try again.')
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
      alert('Failed to download file. Please try again.')
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Medical Records</h1>
          <p className="text-gray-600">Manage your medical documents and files</p>
        </div>

        {/* Medical Records Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>My Medical Records ({records.length})</span>
                </CardTitle>
                <CardDescription>
                  Your uploaded medical documents and files
                </CardDescription>
              </div>
              <Button onClick={() => setShowUploadModal(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Record
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No medical records yet</h3>
                <p className="text-gray-600 mb-6">Upload your first medical document to get started</p>
                <Button onClick={() => setShowUploadModal(true)} size="lg">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Medical Record
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{record.fileName}</h3>
                        <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                        {record.description && (
                          <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {record.doctorNote && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Doctor&apos;s Note</span>
                          </div>
                          <p className="text-sm text-green-700">{record.doctorNote}</p>
                        </div>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleViewFile(record)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadFile(record)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
                ) : viewingFile.fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
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

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleFileUpload}
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
