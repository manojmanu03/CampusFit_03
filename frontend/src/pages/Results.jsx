import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import Layout from '../components/Layout.jsx'

export default function Results(){
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [celebrating, setCelebrating] = useState(false)

  useEffect(()=>{
    (async ()=>{
      setLoading(true); setError('')
      try {
        const { data } = await api.get('/api/results')
        setData(data)
        // Trigger celebration animation after data loads
        setTimeout(() => setCelebrating(true), 500)
      } catch (e) {
        setError('Failed to load results')
      } finally { setLoading(false) }
    })()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Calculating Your Results...</h2>
            <p className="text-gray-600">Analyzing your performance</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="text-6xl mb-6">⚠️</div>
            <h2 className="text-2xl font-bold mb-2 text-red-600">Error Loading Results</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!data) return null

  const pred = data.prediction || {}
  const score = pred.calculated_score ?? 0
  const ready = pred.placement_readiness === 1
  const fit = pred.company_fit || 'N/A'

  // Calculate progress ring values
  const scorePercentage = Math.min((score / 100) * 100, 100)
  const circumference = 2 * Math.PI * 45 // radius = 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (scorePercentage / 100) * circumference

  return (
    <Layout>
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          {/* Celebration Header */}
          <div className={`text-center mb-12 transition-all duration-1000 ${celebrating ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-5xl font-bold gradient-text mb-4">Assessment Complete!</h1>
            <p className="text-xl text-gray-600">Here's your comprehensive performance analysis</p>
          </div>

          {/* Main Results Cards */}
          <div className={`grid lg:grid-cols-3 gap-8 mb-12 transition-all duration-1000 delay-300 ${celebrating ? 'animate-fadeInUp' : 'opacity-0'}`}>
            {/* Score Card with Progress Ring */}
            <div className="card hover-lift p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-600 mb-6">Overall Score</h3>
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-2000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">{score}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">Out of 100</div>
              </div>
            </div>

            {/* Placement Readiness */}
            <div className="card hover-lift p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-400/10 to-blue-500/10 rounded-full -translate-y-12 -translate-x-12"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-600 mb-6">Placement Ready</h3>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl ${ready ? 'bg-green-100' : 'bg-red-100'}`}>
                  {ready ? '✅' : '❌'}
                </div>
                <div className={`text-2xl font-bold mb-2 ${ready ? 'text-green-600' : 'text-red-600'}`}>
                  {ready ? 'Yes' : 'Not Yet'}
                </div>
                <div className="text-sm text-gray-500">
                  {ready ? 'You\'re ready for placements!' : 'Keep improving your skills'}
                </div>
              </div>
            </div>

            {/* Company Fit */}
            <div className="card hover-lift p-8 text-center relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-28 h-28 bg-gradient-to-tl from-purple-400/10 to-pink-500/10 rounded-full translate-y-14 translate-x-14"></div>
              <div className="relative">
                <h3 className="text-lg font-semibold text-gray-600 mb-6">Best Company Fit</h3>
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-2xl">
                  🏢
                </div>
                <div className="text-2xl font-bold text-primary mb-2">{fit}</div>
                <div className="text-sm text-gray-500">Recommended company type</div>
              </div>
            </div>
          </div>

          {/* Achievement Badges */}
          <div className={`mb-12 transition-all duration-1000 delay-500 ${celebrating ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h2 className="text-2xl font-bold text-center mb-8">Your Achievements</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {score >= 80 && (
                <div className="badge-card">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="font-semibold">High Performer</div>
                  <div className="text-xs text-gray-500">Score 80+</div>
                </div>
              )}
              {score >= 60 && (
                <div className="badge-card">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="font-semibold">Good Score</div>
                  <div className="text-xs text-gray-500">Score 60+</div>
                </div>
              )}
              {ready && (
                <div className="badge-card">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-semibold">Placement Ready</div>
                  <div className="text-xs text-gray-500">Ready for interviews</div>
                </div>
              )}
              <div className="badge-card">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold">Assessment Complete</div>
                <div className="text-xs text-gray-500">All tests finished</div>
              </div>
            </div>
          </div>

          {/* Personalized Recommendations */}
          <div className={`space-y-8 mb-12 transition-all duration-1000 delay-700 ${celebrating ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <h2 className="text-3xl font-bold text-center mb-8">Your Personalized Recommendations</h2>
            
            {/* Strengths & Improvements */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-green-600 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">💪</span>
                  Your Strengths
                </h3>
                <ul className="space-y-3">
                  {data.recommendations?.strengths?.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  )) || (
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span> 
                      <span>Completed comprehensive assessment</span>
                    </li>
                  )}
                </ul>
              </div>

              {data.recommendations?.improvements && data.recommendations.improvements.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-xl font-semibold text-orange-600 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">🎯</span>
                    Areas to Improve
                  </h3>
                  <ul className="space-y-3">
                    {data.recommendations.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-orange-500 mt-1">→</span>
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-blue-600 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">📋</span>
                Action Plan
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {data.recommendations?.action_items?.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 mt-1 font-bold">{index + 1}.</span>
                    <span className="text-gray-700">{action}</span>
                  </div>
                )) || (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500">1.</span> 
                    <span>Continue improving your skills</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Recommendations */}
            {data.recommendations?.company_recommendations && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-purple-600 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">🏢</span>
                  Recommended Companies
                </h3>
                <div className="flex flex-wrap gap-3">
                  {data.recommendations.company_recommendations.map((company, index) => (
                    <span key={index} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={`text-center space-y-4 transition-all duration-1000 delay-1000 ${celebrating ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-primary text-lg px-8 py-4"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => navigate('/profile')} 
                className="btn-secondary text-lg px-8 py-4"
              >
                Update Profile
              </button>
              <button 
                onClick={() => window.print()} 
                className="btn-outline text-lg px-8 py-4"
              >
                Print Results
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Share your results with potential employers or save them for future reference
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
