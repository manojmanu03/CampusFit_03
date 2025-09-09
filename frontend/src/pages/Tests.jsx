import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import Layout from '../components/Layout.jsx'

export default function Tests(){
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    (async ()=>{
      try {
        // Try to load test results
        try {
          const { data: resultsData } = await api.get('/results')
          setTestResults(resultsData)
        } catch {
          // Results not available yet
        }
      } catch {} finally {
        setLoading(false)
      }
    })()
  }, [])

  // Calculate test completion
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

  if (loading) {
    return (
      <Layout>
        <div className="py-20">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">Loading Tests...</h2>
            <p className="text-gray-600">Getting your test information</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="w-4/5 mx-auto px-6">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Assessment Center 📝
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Take comprehensive tests to evaluate your placement readiness
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
              <span className="font-semibold">Progress:</span>
              <span>{testStatus.completed}/{testStatus.total} tests completed</span>
            </div>
          </div>

          {/* Test Overview */}
          <div className="card p-8 mb-12 bg-gradient-to-r from-blue-50 to-purple-50">
            <h2 className="text-2xl font-bold mb-6 text-center">Test Overview</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${
                  testResults?.input?.aptitude > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {testResults?.input?.aptitude > 0 ? '✅' : '🧠'}
                </div>
                <h3 className="font-bold text-lg mb-1">Aptitude</h3>
                <p className="text-sm text-gray-600">
                  {testResults?.input?.aptitude > 0 ? `Score: ${testResults.input.aptitude}/30` : 'Not taken'}
                </p>
              </div>

              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${
                  testResults?.input?.technical > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {testResults?.input?.technical > 0 ? '✅' : '💻'}
                </div>
                <h3 className="font-bold text-lg mb-1">Technical</h3>
                <p className="text-sm text-gray-600">
                  {testResults?.input?.technical > 0 ? `Score: ${testResults.input.technical}/30` : 'Not taken'}
                </p>
              </div>

              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${
                  testResults?.input?.communication > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {testResults?.input?.communication > 0 ? '✅' : '💬'}
                </div>
                <h3 className="font-bold text-lg mb-1">Communication</h3>
                <p className="text-sm text-gray-600">
                  {testResults?.input?.communication > 0 ? `Score: ${testResults.input.communication}/30` : 'Not taken'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Test Completion</span>
                <span>{Math.round((testStatus.completed / testStatus.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000"
                  style={{width: `${Math.round((testStatus.completed / testStatus.total) * 100)}%`}}
                ></div>
              </div>
            </div>
          </div>

          {/* Assessment Cards */}
          <div className="mb-12">
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

          {/* Tips Section */}
          <div className="card p-8 bg-gradient-to-r from-yellow-50 to-orange-50 mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center text-orange-800">Test Tips 💡</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-lg mb-3 text-orange-700">Before Taking Tests:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Ensure stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Find a quiet, distraction-free environment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Read instructions carefully</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Keep track of time during the test</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-3 text-orange-700">Test Strategy:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Start with questions you're confident about</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Don't spend too much time on one question</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Review your answers if time permits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>Stay calm and focused throughout</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Results CTA */}
          {testStatus.completed > 0 && (
            <div className="card p-8 bg-gradient-to-r from-primary to-secondary text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to See Your Results?</h2>
              <p className="text-xl text-pink-100 mb-8">
                You've completed {testStatus.completed} test{testStatus.completed > 1 ? 's' : ''}. 
                Get comprehensive insights into your performance and personalized recommendations.
              </p>
              <Link to="/results" className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform">
                View Detailed Results
                <span>📊</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
