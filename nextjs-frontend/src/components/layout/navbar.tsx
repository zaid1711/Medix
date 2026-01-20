'use client'

import { Button } from '@/components/ui/button'
import { EnhancedDropdown } from '@/components/ui/enhanced-dropdown'
import { User as UserType } from '@/types'

interface NavbarProps {
  user: UserType
  onLogout: () => void
}

export function Navbar({ user, onLogout }: NavbarProps) {
  return (
    <nav className="static-navbar sticky top-0 z-30 w-full">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Medix branding */}
        <div className="flex items-center space-x-6">
          <div className="text-white font-bold text-xl">
            Medix
          </div>
        </div>

        {/* Right side - Profile dropdown */}
        <div className="flex items-center space-x-4">
          <EnhancedDropdown user={user} onLogout={onLogout} />
        </div>
      </div>
    </nav>
  )
}
