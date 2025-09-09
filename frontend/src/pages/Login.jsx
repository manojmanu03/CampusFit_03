import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Login({ onAuth }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      onAuth?.(data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-pink-50 to-white">
      {/* Left Side - Gradient Art */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-secondary items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="animate-float mb-8">
            <div className="w-32 h-32 bg-white/20 rounded-3xl mx-auto flex items-center justify-center backdrop-blur">
              <span className="text-6xl">🎯</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-xl text-pink-100">Continue your journey to placement success</p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">Sign In</h1>
            <p className="text-gray-600">Access your personalized dashboard</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in-up">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input 
                  value={username} 
                  onChange={e=>setUsername(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                'Continue to Dashboard'
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary font-semibold hover:underline">
                  Create one free
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Secure Login</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Fast Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
