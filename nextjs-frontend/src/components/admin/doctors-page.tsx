'use client'

import { useState, useEffect } from 'react'
import { UserCheck, Search, UserX, Mail, Calendar, Award } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/types'
import { usersApi } from '@/lib/api'
import { cn, getInitials, formatDate } from '@/lib/utils'

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')


  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    try {
      setLoading(true)
      const usersData = await usersApi.getAll()
      const doctorsData = usersData.filter(user => user.role === 'Doctor')
      setDoctors(doctorsData)
    } catch (error) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to delete this doctor? This will affect all their appointments.')) {
      try {
        await usersApi.delete(doctorId)
        setDoctors(doctors.filter(doctor => doctor.id !== doctorId))
      } catch (error) {
        console.error('Error deleting doctor:', error)
      }
    }
  }



  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Management</h1>
        <p className="text-gray-600 mt-2">View and manage all doctor accounts in the system</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor List</CardTitle>
          <CardDescription>Search and manage doctor accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Doctors List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'No doctors have been registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-700">
                        {getInitials(doctor.name)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">Dr. {doctor.name}</h3>
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{doctor.email}</span>
                        </div>
                      </div>
                      {doctor.createdAt && (
                        <p className="text-xs text-gray-500">
                          Registered: {formatDate(doctor.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDoctor(doctor.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  )
}
