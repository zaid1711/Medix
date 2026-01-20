'use client'

import { useState, useEffect } from 'react'
import { Users, UserCheck, UserPlus, Calendar, FileText, TrendingUp } from 'lucide-react'
import { usersApi, dashboardApi, appointmentsApi, recordsApi } from '@/lib/api'

interface LocalDashboardStats {
  totalPatients: number
  totalDoctors: number
  newMembersThisMonth: number
  totalAppointments: number
  totalRecords: number
  appointmentsThisMonth?: number
  recordsThisMonth?: number
  appointmentStats?: {
    pending: number
    confirmed: number
    completed: number
  }
}

export function AdminDashboard() {
  const [stats, setStats] = useState<LocalDashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    newMembersThisMonth: 0,
    totalAppointments: 0,
    totalRecords: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [usersData, appointmentsData, recordsData] = await Promise.all([
        usersApi.getAll().catch(() => []),
        appointmentsApi.getAll().catch(() => []),
        recordsApi.getAll().catch(() => [])
      ])
      
      // Calculate user stats
      const filteredUsers = usersData.filter(user => user.role !== 'Admin')
      const totalPatients = filteredUsers.filter(user => user.role === 'Patient').length
      const totalDoctors = filteredUsers.filter(user => user.role === 'Doctor').length
      
      // Calculate new members this month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const newMembersThisMonth = filteredUsers.filter(user => {
        if (user.createdAt) {
          const userCreatedDate = new Date(user.createdAt)
          return userCreatedDate >= startOfMonth
        }
        return false
      }).length
      
      // Calculate real appointment stats
      const totalAppointments = appointmentsData.length
      const appointmentsThisMonth = appointmentsData.filter(appointment => {
        if (appointment.createdAt) {
          const appointmentDate = new Date(appointment.createdAt)
          return appointmentDate >= startOfMonth
        }
        return false
      }).length
      
      // Calculate real record stats
      const totalRecords = recordsData.length
      const recordsThisMonth = recordsData.filter(record => {
        if (record.date) {
          const recordDate = new Date(record.date)
          return recordDate >= startOfMonth
        }
        return false
      }).length
      
      const calculatedStats = {
        totalPatients,
        totalDoctors,
        newMembersThisMonth,
        totalAppointments,
        totalRecords,
        appointmentsThisMonth,
        recordsThisMonth
      }
      
      // Try to get additional stats from dashboard API
      try {
        const detailedStats = await dashboardApi.getStats()
        setStats({ ...calculatedStats, ...detailedStats })
      } catch (statsError) {
        console.warn('Dashboard API not available, using calculated stats:', statsError)
        setStats(calculatedStats)
      }
      
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values if all API calls fail
      setStats({
        totalPatients: 0,
        totalDoctors: 0,
        newMembersThisMonth: 0,
        totalAppointments: 0,
        totalRecords: 0
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage system users and view analytics</p>
      </div>

      {/* Colorful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Total Users</span>
              </div>
              <div className="text-3xl font-bold">{loading ? '...' : stats.totalPatients + stats.totalDoctors}</div>
              <div className="text-sm opacity-75 mt-1">
                {loading ? "Loading..." : `${stats.newMembersThisMonth} new this month`}
              </div>
            </div>
          </div>
        </div>

        {/* Total Appointments Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Total Appointment</span>
              </div>
              <div className="text-3xl font-bold">{loading ? '...' : stats.totalAppointments}</div>
              <div className="text-sm opacity-75 mt-1">
                {loading ? "Loading..." : `${stats.appointmentsThisMonth || 0} this month`}
              </div>
            </div>
          </div>
        </div>

        {/* Total Records Card */}
        <div className="bg-gradient-to-br from-pink-400 to-red-500 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Total Records</span>
              </div>
              <div className="text-3xl font-bold">{loading ? '...' : stats.totalRecords}</div>
              <div className="text-sm opacity-75 mt-1">
                {loading ? "Loading..." : `${stats.recordsThisMonth || 0} this month`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Patients */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalPatients}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Doctors */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.totalDoctors}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* New Members */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Members</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.newMembersThisMonth}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '...' : stats.totalPatients + stats.totalDoctors > 0 ? 
                  Math.round((stats.newMembersThisMonth / (stats.totalPatients + stats.totalDoctors)) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">Monthly</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
