'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { User as UserType } from '@/types'

interface EnhancedDropdownProps {
  user: UserType
  onLogout: () => void
  className?: string
}

export function EnhancedDropdown({ user, onLogout, className = '' }: EnhancedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleNavigation = async (path: string) => {
    setIsNavigating(true)
    setIsOpen(false)
    
    try {
      // Use router.push with proper error handling
      router.push(path)
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location if router fails
      if (typeof window !== 'undefined') {
        window.location.href = path
      }
    } finally {
      setIsNavigating(false)
    }
  }

  const handleDashboardNavigation = () => {
    setIsNavigating(true)
    setIsOpen(false)
    
    try {
      // Navigate to appropriate dashboard based on user role
      if (user.role === 'Admin') {
        router.push('/admin')
      } else if (user.role === 'Doctor') {
        router.push('/doctor')
      } else {
        router.push('/patient')
      }
    } catch (error) {
      console.error('Navigation error:', error)
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    } finally {
      setIsNavigating(false)
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    onLogout()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'doctor':
        return 'bg-blue-100 text-blue-800'
      case 'patient':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="text-white hover:bg-white/10 transition-all duration-200 relative"
        disabled={isNavigating}
      >
        <User className="h-5 w-5" />
        {isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Profile */}
            <button
              onClick={() => handleNavigation('/profile')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 mr-3 text-gray-500" />
              Profile
            </button>

            {/* Change Password */}
            <button
              onClick={() => handleNavigation('/change-password')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="h-4 w-4 mr-3 text-gray-500" />
              Change Password
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
