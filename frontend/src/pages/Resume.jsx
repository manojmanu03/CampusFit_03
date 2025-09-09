import React, { useState } from 'react'
import Layout from '../components/Layout'

export default function Resume() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [showJobInput, setShowJobInput] = useState(false)
  const [showContentDetails, setShowContentDetails] = useState(false)
  const [showATSDetails, setShowATSDetails] = useState(false)
  const [processingSteps, setProcessingSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [resumeContent, setResumeContent] = useState('')

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return
    
    setFile(selectedFile)
    setLoading(true)
    setError('')
    setAnalysis(null)
    setResumeContent('')
    setCurrentStep(0)

    // Initialize processing steps
    const steps = [
      { id: 1, title: 'Uploading Resume', description: 'Securely uploading your file...', status: 'active' },
      { id: 2, title: 'Extracting Content', description: 'Reading and parsing document content...', status: 'pending' },
      { id: 3, title: 'Content Analysis', description: 'Analyzing structure, formatting, and content quality...', status: 'pending' },
      { id: 4, title: 'ATS Compatibility Check', description: 'Evaluating compatibility with applicant tracking systems...', status: 'pending' },
      { id: 5, title: 'Generating Insights', description: 'Creating personalized recommendations and feedback...', status: 'pending' }
    ]

    if (jobDescription.trim()) {
      steps.splice(4, 0, { 
        id: 6, 
        title: 'Job Matching Analysis', 
        description: 'Comparing resume against job requirements...', 
        status: 'pending' 
      })
    }

    setProcessingSteps(steps)

    const formData = new FormData()
    formData.append('resume', selectedFile)
    if (jobDescription.trim()) {
      formData.append('job_description', jobDescription.trim())
    }

    // Simulate processing steps with delays
    const simulateProcessing = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i)
        setProcessingSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index < i ? 'completed' : index === i ? 'active' : 'pending'
        })))
        
        // Add realistic delays between steps
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
        }
      }
    }

    try {
      // Start the visual processing simulation
      simulateProcessing()

      const response = await fetch('/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()
      
      if (response.ok) {
        // Set resume content if available
        if (data.resume_text) {
          setResumeContent(data.resume_text)
        }
        
        // Complete all steps
        setProcessingSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
        setCurrentStep(steps.length)
        
        // Small delay before showing results
        setTimeout(() => {
          setAnalysis(data)
          setShowContentDetails(false)
          setShowATSDetails(false)
          console.log('Resume analysis updated:', data)
        }, 500)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setTimeout(() => setLoading(false), 1000)
    }
  }

  const onFile = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.includes('pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      handleFile(file)
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Compact Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">
              Resume Analysis
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Upload your resume for instant feedback and job-specific analysis.
            </p>
          </div>

          {!analysis && !loading && (
            <div className="max-w-4xl mx-auto">
              {(file || jobDescription.trim()) && (
                <div className="text-center mb-6">
                  <button
                    onClick={() => {
                      setFile(null)
                      setJobDescription('')
                      setAnalysis(null)
                      setError('')
                      setShowJobInput(false)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    ← Start Over
                  </button>
                </div>
              )}
              {/* Compact Job Description Input */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-md font-semibold text-gray-900">🎯 Job Description (Optional)</h3>
                  <button
                    onClick={() => setShowJobInput(!showJobInput)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                  >
                    {showJobInput ? 'Hide' : 'Add'}
                    <span className={`transform transition-transform ${showJobInput ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                </div>
                
                {showJobInput && (
                  <div className="space-y-3">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job description for personalized analysis..."
                      className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="text-xs text-gray-500">
                      💡 Improves accuracy by 40%
                    </div>
                  </div>
                )}
              </div>
              
              {/* Compact Upload Area */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-white text-2xl">📤</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 text-gray-800">
                    Drop resume here or click to browse
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {jobDescription.trim() ? '🎯 Ready for job-specific analysis' : 'PDF, DOC, DOCX supported'}
                  </p>
                  
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={onFile} 
                    className="hidden" 
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg">
                    <span>📁</span>
                    Choose File
                  </label>
                </div>
              </div>
            </div>
          )}

                {/* Enhanced Processing State */}
                {(loading || (analysis && processingSteps.length > 0)) && (
                  <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Processing Steps */}
                      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 relative">
                            <div className="w-full h-full rounded-full border-4 border-gray-200"></div>
                            {loading ? (
                              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                            ) : (
                              <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-green-500"></div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-xl ${loading ? 'text-blue-600' : 'text-green-600'}`}>
                                {loading ? '🔍' : '✅'}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-xl font-bold mb-2">
                            {loading ? 'Analyzing Your Resume' : 'Analysis Complete'}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {loading ? 'AI-powered analysis in progress...' : 'Your resume has been successfully analyzed'}
                          </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="space-y-4">
                          {processingSteps.map((step, index) => (
                            <div key={step.id} className="flex items-start gap-4">
                              <div className="flex-shrink-0 mt-1">
                                {step.status === 'completed' ? (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                ) : step.status === 'active' ? (
                                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  step.status === 'completed' ? 'text-green-700' : 
                                  step.status === 'active' ? 'text-blue-700' : 'text-gray-500'
                                }`}>
                                  {step.title}
                                </h4>
                                <p className={`text-sm ${
                                  step.status === 'completed' ? 'text-green-600' : 
                                  step.status === 'active' ? 'text-blue-600' : 'text-gray-400'
                                }`}>
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-6">
                          <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Progress</span>
                            <span>{Math.round((currentStep / processingSteps.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                              style={{width: `${Math.round((currentStep / processingSteps.length) * 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Resume Content Preview */}
                      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                        <div className="mb-6">
                          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <span>📄</span>
                            Resume Content Preview
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {resumeContent ? 'Content extracted successfully' : 'Extracting content from your resume...'}
                          </p>
                        </div>

                        {resumeContent ? (
                          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {resumeContent.substring(0, 1500)}
                              {resumeContent.length > 1500 && (
                                <div className="text-gray-500 italic mt-2">
                                  ... and {resumeContent.length - 1500} more characters
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-8 text-center">
                            <div className="animate-pulse space-y-3">
                              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
                              <div className="h-4 bg-gray-300 rounded w-5/6 mx-auto"></div>
                              <div className="h-4 bg-gray-300 rounded w-2/3 mx-auto"></div>
                            </div>
                            <p className="text-gray-500 text-sm mt-4">
                              Reading your resume content...
                            </p>
                          </div>
                        )}

                        {/* File Info */}
                        {file && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-blue-600">📎</span>
                              <span className="font-medium text-blue-800">{file.name}</span>
                              <span className="text-blue-600">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-6 text-center">
                      <div className="inline-flex items-center gap-4 text-sm text-gray-600 bg-white rounded-full px-6 py-3 shadow-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-green-500">🔒</span>
                          <span>Secure Processing</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-blue-500">🤖</span>
                          <span>AI Analysis</span>
                        </div>
                        <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-purple-500">⚡</span>
                          <span>Real-time Results</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compact Error State */}
          {error && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-2xl mb-2">❌</div>
                  <h4 className="font-semibold text-red-800 mb-1">Upload Failed</h4>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Results Section - Wireframe Layout */}
          {analysis && (
            <div className="max-w-7xl mx-auto" key={`analysis-${analysis.score || analysis.resume_score || Date.now()}`}>              
              {/* Main Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
                {/* Left Column - Resume Text & Score */}
                <div className="lg:col-span-1 space-y-6">              
                  {/* Score Summary */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="text-center mb-4">
                      <div className="relative w-24 h-24 mx-auto mb-3">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="35" stroke="#e5e7eb" strokeWidth="8" fill="none"/>
                          <circle 
                            cx="50" cy="50" r="35" 
                            stroke={(analysis.score || analysis.resume_score || 0) >= 80 ? "#10b981" : (analysis.score || analysis.resume_score || 0) >= 60 ? "#f59e0b" : "#ef4444"}
                            strokeWidth="8" 
                            fill="none"
                            strokeDasharray={`${(analysis.score || analysis.resume_score || 0) * 2.2} 220`}
                            className="transition-all duration-1000"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${(analysis.score || analysis.resume_score || 0) >= 80 ? 'text-green-600' : (analysis.score || analysis.resume_score || 0) >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                              {Math.round(analysis.score || analysis.resume_score || 0)}
                            </div>
                            <div className="text-xs text-gray-500">/100</div>
                          </div>
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Overall Score</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quality Score:</span>
                        <span className={`font-semibold ${analysis.quality_score >= 80 ? 'text-green-600' : analysis.quality_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(analysis.quality_score || 0)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ATS Score:</span>
                        <span className={`font-semibold ${analysis.ats_score >= 80 ? 'text-green-600' : analysis.ats_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {Math.round(analysis.ats_score || 0)}%
                        </span>
                      </div>
                      {/* Overall Assessment */}
                  {analysis.overall_assessment && (
                    <div className="bg-white rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 text-lg">💡</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Overall Assessment</h4>
                          <p className="text-gray-700">
                            {analysis.overall_assessment?.replace(/[🎉👍⚠️📝]/g, '').trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Detailed Analysis */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Content & Structure Quality */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div 
                      className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setShowContentDetails(!showContentDetails)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 text-lg">📝</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Content & Structure Quality</h3>
                      </div>
                      <div className={`transform transition-transform duration-200 ${
                        showContentDetails ? 'rotate-180' : ''
                      }`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {showContentDetails && (
                      <div className="space-y-3 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {analysis.quality_feedback?.map((item, index) => {
                        if (item.includes('===')) {
                          return (
                            <div key={index} className="text-sm font-medium text-green-800 mt-4 mb-2 border-b border-green-200 pb-1">
                              {item.replace(/===/g, '').trim()}
                            </div>
                          );
                        }

                        const isPositive = item.includes('✅');
                        const cleanText = item.replace(/[✅❌⚠️]/g, '').trim();

                        return (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0 mt-0.5">
                              {isPositive ? (
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${isPositive ? 'text-green-800' : 'text-amber-800'}`}>
                              {cleanText}
                            </p>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* ATS Compatibility */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div 
                      className="flex items-center justify-between mb-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => setShowATSDetails(!showATSDetails)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-lg">🎯</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {analysis.job_aware ? 'Job-Specific ATS Analysis' : 'ATS Compatibility'}
                        </h3>
                      </div>
                      <div className={`transform transition-transform duration-200 ${
                        showATSDetails ? 'rotate-180' : ''
                      }`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {showATSDetails && (
                      <div className="space-y-3 max-h-80 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {analysis.ats_feedback?.map((item, index) => {
                        if (item.includes('===')) {
                          return (
                            <div key={index} className="text-sm font-medium text-blue-800 mt-4 mb-2 border-b border-blue-200 pb-1">
                              {item.replace(/===/g, '').trim()}
                            </div>
                          );
                        }

                        const isPositive = item.includes('✅');
                        const isJobSpecific = item.includes('🎯') || item.includes('📊');
                        const cleanText = item.replace(/[✅❌⚠️🎯📊💡]/g, '').trim();

                        return (
                          <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                            isJobSpecific ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}>
                            <div className="flex-shrink-0 mt-0.5">
                              {isJobSpecific ? (
                                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center">
                                  <span className="text-blue-700 text-xs">🎯</span>
                                </div>
                              ) : isPositive ? (
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isJobSpecific ? 'text-blue-800' : 
                              isPositive ? 'text-green-800' : 'text-amber-800'
                            }`}>
                              {cleanText}
                            </p>
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
