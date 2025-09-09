import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../lib/api'

export default function Register(){
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setOk(false); setLoading(true)
    try {
      await api.post('/auth/register', form)
      setOk(true)
      setTimeout(()=> navigate('/auth/login'), 1500)
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed')
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
              <span className="text-6xl">🚀</span>
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-4">Start Your Journey!</h2>
          <p className="text-xl text-pink-100">Join thousands of successful students</p>
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-xs mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold">10K+</div>
              <div className="text-sm text-pink-200">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">95%</div>
              <div className="text-sm text-pink-200">Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">AI</div>
              <div className="text-sm text-pink-200">Powered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">Create Account</h1>
            <p className="text-gray-600">Start your placement success story</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {ok && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg animate-fade-in-up text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">Account Created!</span>
                </div>
                <p>Redirecting to login...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-fade-in-up">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                  value={form.username} 
                  onChange={e=>setForm({...form, username:e.target.value})}
                  placeholder="Choose a unique username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                  value={form.email} 
                  onChange={e=>setForm({...form, email:e.target.value})}
                  placeholder="Enter your email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                  value={form.password} 
                  onChange={e=>setForm({...form, password:e.target.value})}
                  placeholder="Create a strong password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || ok}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : ok ? (
                'Account Created! ✓'
              ) : (
                'Create Free Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-primary font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-4">By creating an account, you agree to our Terms & Privacy Policy</p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>No Credit Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
