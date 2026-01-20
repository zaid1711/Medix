'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/api'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authApi.login(email, password)
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Redirect based on role
      if (response.user.role === 'Admin') {
        router.push('/admin')
      } else if (response.user.role === 'Doctor') {
        router.push('/doctor')
      } else {
        router.push('/patient')
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Header */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-lg font-bold">⚕️</span>
              </div>
              <span className="text-xl font-bold">Medix</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Healthcare Illustration */}
            <div className="flex justify-center items-center">
              <img 
                src="/assets/landing.svg" 
                alt="Healthcare Illustration" 
                width={320}
                height={200}
                style={{ display: 'block', background: 'none' }}
                className="object-contain"
              />
            </div>

            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold">Enhance impact in healthcare</h1>
              <p className="text-lg opacity-90 max-w-md mx-auto">
                Your impact in healthcare just got stronger. Enhance patient care through refined data control, seamless appointments and impactful task management.
              </p>
            </div>
          </div>

          <div></div> {/* Spacer */}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center">
            <button 
              onClick={() => router.push('/')}
              className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <span className="text-white text-xl font-bold">⚕️</span>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Login to your account</h2>
              <p className="mt-2 text-gray-600">
                Login to access your healthcare dashboard. Explore appointments, manage tasks and patient records with ease.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Login'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have an account yet?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-teal-600 hover:text-teal-500 font-medium"
                >
                  Signup
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
