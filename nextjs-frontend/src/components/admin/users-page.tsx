'use client'

import { useState, useEffect } from 'react'
import { Users, Search, UserX, Mail, Shield, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@/types'
import { usersApi } from '@/lib/api'
import { cn, getInitials, formatDate } from '@/lib/utils'

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const usersData = await usersApi.getAll()
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user?.role === 'Admin') {
      alert('Cannot delete admin users.')
      return
    }

    if (confirm(`Are you sure you want to delete this ${user?.role?.toLowerCase()}? This action cannot be undone.`)) {
      try {
        await usersApi.delete(userId)
        setUsers(users.filter(u => u.id !== userId))
        alert('User deleted successfully.')
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Failed to delete user. Please try again.')
      }
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'All' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Doctor':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Patient':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Doctor':
        return <UserCheck className="h-4 w-4" />
      case 'Patient':
        return <Users className="h-4 w-4" />
      case 'Admin':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
        <p className="text-gray-600 mt-2">Complete overview of all system users</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Roles</option>
              <option value="Doctor">Doctors</option>
              <option value="Patient">Patients</option>
            </select>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {searchTerm || roleFilter !== 'All' 
                  ? 'Try adjusting your search criteria' 
                  : 'No users have been registered yet'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      user.role === 'Admin' ? 'bg-purple-100' : 
                      user.role === 'Doctor' ? 'bg-green-100' : 'bg-blue-100'
                    )}>
                      <span className={cn(
                        "text-sm font-medium",
                        user.role === 'Admin' ? 'text-purple-700' : 
                        user.role === 'Doctor' ? 'text-green-700' : 'text-blue-700'
                      )}>
                        {getInitials(user.name)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {user.role === 'Doctor' ? 'Dr. ' : ''}{user.name}
                        </h3>
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                      {user.createdAt && (
                        <p className="text-xs text-gray-500">
                          Registered: {formatDate(user.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full border",
                      getRoleBadgeColor(user.role)
                    )}>
                      {user.role}
                    </span>
                    {user.role !== 'Admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
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
