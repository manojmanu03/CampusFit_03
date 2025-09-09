import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Layout from '../components/Layout.jsx'

export default function Dashboard(){
  const [profile, setProfile] = useState(null)
  const [resumeScore, setResumeScore] = useState(null)
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try {
        // Load profile data
        const { data: profileData } = await api.get('/profile')
        setProfile(profileData)

        // Try to load test results
        try {
          const { data: resultsData } = await api.get('/results')
          setTestResults(resultsData)
        } catch {
          // Results not available yet
        }

        // Get resume score from profile data
        if (profileData && profileData.resume_score) {
          setResumeScore(Math.round(profileData.resume_score / 10)) // Convert from percentage to 0-10 scale
        }
      } catch {} finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Dashboard...</h2>
            <p className="text-gray-600">Getting your latest information</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Calculate profile completion based on all required fields
  const calculateProfileCompletion = () => {
    if (!profile) return { complete: false, percentage: 0 }
    
    const requiredFields = ['cgpa', 'branch']
    const optionalFields = ['backlogs', 'certifications', 'internship', 'projects', 'hackathon']
    
    const filledRequired = requiredFields.filter(field => 
      profile[field] !== undefined && profile[field] !== '' && profile[field] !== null
    ).length
    
    const filledOptional = optionalFields.filter(field => 
      profile[field] !== undefined && profile[field] !== '' && profile[field] !== null && profile[field] !== '0'
    ).length
    
    // Profile is complete if all required fields are filled and at least 2 optional fields
    const complete = filledRequired === requiredFields.length && filledOptional >= 2
    const percentage = Math.round(((filledRequired / requiredFields.length) * 60 + (filledOptional / optionalFields.length) * 40))
    
    return { complete, percentage, filledRequired, filledOptional, totalRequired: requiredFields.length, totalOptional: optionalFields.length }
  }
  
  const profileStatus = calculateProfileCompletion()
  const profileComplete = profileStatus.complete
  
  // Calculate test completion more accurately
  const calculateTestCompletion = () => {
    if (!testResults || !testResults.input) return { completed: 0, total: 3 }
    
    let completed = 0
    const scores = testResults.input
    if (scores.aptitude && scores.aptitude > 0) completed++
    if (scores.technical && scores.technical > 0) completed++
    if (scores.communication && scores.communication > 0) completed++
    
    return { completed, total: 3 }
  }
  
  const testStatus = calculateTestCompletion()
  const testsCompleted = testStatus.completed
  const placementReady = testResults?.prediction?.placement_readiness === 1

  return (
    <Layout>
      <div className="py-8">
        <div className="w-4/5 mx-auto px-6">
          {/* Welcome Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Welcome back{profile?.name ? `, ${profile.name}` : ''}! 👋
            </h1>
            <p className="text-lg md:text-xl text-gray-600">Track your progress and continue your placement journey</p>
          </div>

          {/* Progress Overview */}
          <div className="card p-8 mb-12 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-2xl font-bold mb-6 text-center">Your Progress Overview</h2>
            <div className="grid md:grid-cols-4 gap-10">
              {/* Profile Status */}
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
                  profileComplete ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {profileComplete ? '✅' : '⭕'}
                </div>
                <h3 className="font-bold text-lg mb-1">Profile</h3>
                <p className="text-sm text-gray-600">
                  {profileComplete ? 'Complete' : `${profileStatus.percentage}% complete`}
                </p>
              </div>

              {/* Resume Status */}
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
                  resumeScore ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {resumeScore ? '📄' : '⭕'}
                </div>
                <h3 className="font-bold text-lg mb-1">Resume</h3>
                <p className="text-sm text-gray-600">
                  {resumeScore ? `Score: ${resumeScore}/10` : 'Not uploaded'}
                </p>
              </div>

              {/* Tests Status */}
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
                  testsCompleted > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {testsCompleted > 0 ? '📝' : '⭕'}
                </div>
                <h3 className="font-bold text-lg mb-1">Tests</h3>
                <p className="text-sm text-gray-600">
                  {testsCompleted > 0 ? `${testsCompleted}/${testStatus.total} completed` : 'Not started'}
                </p>
              </div>

              {/* Placement Ready */}
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl ${
                  placementReady ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                }`}>
                  {placementReady ? '🎯' : '❌'}
                </div>
                <h3 className="font-bold text-lg mb-1">Placement</h3>
                <p className="text-sm text-gray-600">
                  {placementReady ? 'Ready!' : 'Not ready'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(((profileComplete ? 25 : profileStatus.percentage * 0.25) + (resumeScore ? 25 : 0) + (testsCompleted / testStatus.total * 25) + (placementReady ? 25 : 0)))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000"
                  style={{width: `${Math.round(((profileComplete ? 25 : profileStatus.percentage * 0.25) + (resumeScore ? 25 : 0) + (testsCompleted / testStatus.total * 25) + (placementReady ? 25 : 0)))}%`}}
                ></div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          {(!profileComplete || !resumeScore || testsCompleted === 0) && (
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-8 text-center">What's Next? 🚀</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {!profileComplete && (
                  <Link to="/profile" className="card hover-lift p-6 border-l-4 border-blue-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 text-xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Complete Profile</h3>
                        <p className="text-sm text-gray-600">High Priority</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Fill in your personal details and preferences</p>
                    <div className="text-blue-600 font-semibold">Start Now →</div>
                  </Link>
                )}

                {!resumeScore && (
                  <Link to="/resume" className="card hover-lift p-6 border-l-4 border-green-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <span className="text-green-600 text-xl">📄</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Upload Resume</h3>
                        <p className="text-sm text-gray-600">Recommended</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Get AI-powered analysis and scoring</p>
                    <div className="text-green-600 font-semibold">Upload Now →</div>
                  </Link>
                )}

                {testsCompleted === 0 && (
                  <Link to="/test/aptitude" className="card hover-lift p-6 border-l-4 border-orange-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <span className="text-orange-600 text-xl">📝</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Take Assessment</h3>
                        <p className="text-sm text-gray-600">Essential</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">Start with aptitude test to gauge readiness</p>
                    <div className="text-orange-600 font-semibold">Begin Test →</div>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Quick Actions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link to="/profile" className="card hover-lift p-6 text-center group border-l-4 border-blue-500">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">👤</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">Profile</h3>
                <p className="text-gray-600 text-sm mb-3">Update personal information</p>
                {profileComplete && <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Complete</div>}
              </Link>

              <Link to="/resume" className="card hover-lift p-6 text-center group border-l-4 border-green-500">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">📄</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">Resume</h3>
                <p className="text-gray-600 text-sm mb-3">AI-powered analysis</p>
                {resumeScore && <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Score: {resumeScore}/10</div>}
              </Link>

              <Link to="/test/aptitude" className="card hover-lift p-6 text-center group border-l-4 border-orange-500">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">Tests</h3>
                <p className="text-gray-600 text-sm mb-3">Skill assessments</p>
                {testsCompleted > 0 && <div className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">{testsCompleted}/{testStatus.total} completed</div>}
              </Link>

              <Link to="/results" className="card hover-lift p-6 text-center group border-l-4 border-purple-500">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">Results</h3>
                <p className="text-gray-600 text-sm mb-3">View assessment results</p>
                {placementReady && <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Ready</div>}
              </Link>
            </div>
          </div>

          {/* Assessment Cards */}
          <div id="assessments">
            <h2 className="text-3xl font-bold mb-8 text-center">Available Assessments</h2>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Aptitude Test Card */}
              <div className="card hover-lift p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">🧠</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Aptitude Test</h3>
                    <p className="text-sm text-gray-500">30 minutes</p>
                    {testResults?.input?.aptitude > 0 && (
                      <div className="mt-1">
                        <span className="text-sm font-semibold text-blue-600">
                          Score: {testResults.input.aptitude}/30
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">Test logical reasoning and problem-solving abilities</p>
                {testResults?.input?.aptitude > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center text-green-600 font-semibold mb-3">
                      ✅ Completed
                    </div>
                    <Link to="/test/aptitude" className="btn-secondary w-full text-center">
                      Retake Test
                    </Link>
                  </div>
                ) : (
                  <Link to="/test/aptitude" className="btn-primary w-full text-center">
                    Start Aptitude Test
                  </Link>
                )}
              </div>

              {/* Technical Test Card */}
              <div className="card hover-lift p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💻</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Technical Test</h3>
                    <p className="text-sm text-gray-500">30 minutes</p>
                    {testResults?.input?.technical > 0 && (
                      <div className="mt-1">
                        <span className="text-sm font-semibold text-green-600">
                          Score: {testResults.input.technical}/30
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">Evaluate programming and technical knowledge</p>
                {testResults?.input?.technical > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center text-green-600 font-semibold mb-3">
                      ✅ Completed
                    </div>
                    <Link to="/test/technical" className="btn-secondary w-full text-center">
                      Retake Test
                    </Link>
                  </div>
                ) : (
                  <Link to="/test/technical" className="btn-primary w-full text-center">
                    Start Technical Test
                  </Link>
                )}
              </div>

              {/* Communication Test Card */}
              <div className="card hover-lift p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Communication</h3>
                    <p className="text-sm text-gray-500">30 minutes</p>
                    {testResults?.input?.communication > 0 && (
                      <div className="mt-1">
                        <span className="text-sm font-semibold text-orange-600">
                          Score: {testResults.input.communication}/30
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mb-6">Assess communication and soft skills</p>
                {testResults?.input?.communication > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center text-green-600 font-semibold mb-3">
                      ✅ Completed
                    </div>
                    <Link to="/test/communication" className="btn-secondary w-full text-center">
                      Retake Test
                    </Link>
                  </div>
                ) : (
                  <Link to="/test/communication" className="btn-primary w-full text-center">
                    Start Communication Test
                  </Link>
                )}
              </div>
            </div>
          </div>
          <br/>
        

          {/* Results CTA */}
          <div className="card p-8 bg-gradient-to-r from-primary to-secondary text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to See Your Results?</h2>
            <p className="text-xl text-pink-100 mb-8">Get comprehensive insights into your placement readiness and personalized recommendations.</p>
            <Link to="/results" className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform">
              View Detailed Results
              <span>📊</span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
