'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Users, 
  UserCheck, 
  FileText, 
  Calendar, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User } from '@/types'

interface SidebarProps {
  user: User
  onLogout: () => void
}

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Users,
    roles: ['Admin']
  },
  {
    title: 'Patient Records',
    href: '/doctor',
    icon: UserCheck,
    roles: ['Doctor']
  },
  {
    title: 'Medical Records',
    href: '/patient/records',
    icon: FileText,
    roles: ['Patient']
  },
  {
    title: 'Appointments',
    href: '/patient/appointments',
    icon: Calendar,
    roles: ['Patient']
  }
]

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const userItems = sidebarItems.filter(item => 
    item.roles.includes(user.role)
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/10 backdrop-blur-md border-white/20"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-blue-600 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-blue-500">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">⚕️</span>
              </div>
              <span className="text-white font-semibold text-lg">EHR System</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {userItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href === '/admin' && pathname.startsWith('/admin')) ||
                (item.href === '/doctor' && pathname.startsWith('/doctor')) ||
                (item.href === '/patient/records' && pathname.startsWith('/patient/records')) ||
                (item.href === '/patient/appointments' && pathname.startsWith('/patient/appointments'))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-white transition-all duration-200 hover:bg-white/10",
                    isActive && "sidebar-item-active"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              )
            })}
          </nav>

        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
