import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Layout from '../components/Layout.jsx'

export default function Profile(){
  const [form, setForm] = useState({ cgpa:'', backlogs:'', certifications:'', internship:'', projects:'', hackathon:'', branch:'CSE' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(()=>{
    (async ()=>{
      try { const { data } = await api.get('/profile'); setForm({ ...form, ...data }) } catch {}
    })()
  }, [])

  const save = async () => {
    setMsg('')
    setLoading(true)
    try {
      await api.post('/profile', form)
      setMsg('Profile saved successfully!')
    } catch (err) {
      setMsg(err?.response?.data?.error || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold gradient-text mb-4">Your Profile</h1>
            <p className="text-xl text-gray-600">Complete your academic and project details for better insights</p>
          </div>

          {/* Success/Error Message */}
          {msg && (
            <div className={`mb-8 p-4 rounded-xl animate-fade-in-up ${
              msg.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{msg.includes('success') ? '✅' : '❌'}</span>
                <span className="font-semibold">{msg}</span>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Academic Section */}
            <div className="card hover-lift p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎓</span>
                </div>
                <h2 className="text-2xl font-bold">Academic Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CGPA / Percentage</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.cgpa} 
                    onChange={e=>setForm({...form, cgpa:e.target.value})}
                    placeholder="Enter your CGPA (e.g., 8.5)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Active Backlogs</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.backlogs} 
                    onChange={e=>setForm({...form, backlogs:e.target.value})}
                    placeholder="Number of backlogs"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                  <select 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.branch} 
                    onChange={e=>setForm({...form, branch:e.target.value})}
                  >
                    <option value="CSE">Computer Science Engineering</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="EE">Electrical Engineering</option>
                    <option value="IT">Information Technology</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Skills & Experience */}
            <div className="card hover-lift p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">💼</span>
                </div>
                <h2 className="text-2xl font-bold">Experience</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Internships Completed</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.internship} 
                    onChange={e=>setForm({...form, internship:e.target.value})}
                    placeholder="Number of internships"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.certifications} 
                    onChange={e=>setForm({...form, certifications:e.target.value})}
                    placeholder="Number of certifications"
                  />
                </div>
              </div>
            </div>

            {/* Projects & Activities */}
            <div className="card hover-lift p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <h2 className="text-2xl font-bold">Projects & Activities</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Projects Completed</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.projects} 
                    onChange={e=>setForm({...form, projects:e.target.value})}
                    placeholder="Number of projects"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hackathons Participated</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 input-focus" 
                    value={form.hackathon} 
                    onChange={e=>setForm({...form, hackathon:e.target.value})}
                    placeholder="Number of hackathons"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-12 text-center">
            <button 
              onClick={save}
              disabled={loading}
              className="btn-primary text-lg px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving Profile...
                </div>
              ) : (
                'Save Profile Changes'
              )}
            </button>
          </div>

          {/* Tips Section */}
          <div className="mt-12 card p-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-xl font-bold mb-4 text-center">💡 Profile Tips</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Academic Excellence</h4>
                <p>Maintain a CGPA above 7.0 and minimize backlogs for better placement opportunities.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Practical Experience</h4>
                <p>Internships and projects demonstrate real-world application of your skills.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Skill Validation</h4>
                <p>Certifications from recognized platforms add credibility to your profile.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Innovation & Teamwork</h4>
                <p>Hackathon participation shows problem-solving and collaborative skills.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
