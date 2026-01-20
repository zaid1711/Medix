'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { User } from '@/types'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Users as AllUsers, 
  UserPlus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
    description: 'Overview and statistics'
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    href: '/admin/patients',
    description: 'Manage patient accounts'
  },
  {
    id: 'doctors',
    label: 'Doctors',
    icon: UserCheck,
    href: '/admin/doctors',
    description: 'Manage doctor accounts'
  },
  {
    id: 'all-users',
    label: 'All Users',
    icon: AllUsers,
    href: '/admin/users',
    description: 'View all system users'
  },
  {
    id: 'add-user',
    label: 'Add User',
    icon: UserPlus,
    href: '/admin/add-user',
    description: 'Create new user account'
  }
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData)
          if (parsedUser.role !== 'Admin') {
            router.push('/login')
            return
          }
          setUser(parsedUser)
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setUser(null)
    router.push('/login')
  }

  const handleNavigation = (href: string) => {
    router.push(href)
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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Top Navbar - Full Width */}
      <Navbar user={user} onLogout={handleLogout} />
      
      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar - Full Height */}
        <div className="static-navbar text-white flex flex-col min-h-full w-64">

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 overflow-hidden">
            <ul className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200",
                        "hover:bg-white/20 hover:scale-105",
                        isActive && "bg-white/30 shadow-lg scale-105"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {item.label}
                        </div>
                        <div className="text-white/70 text-xs truncate">
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
