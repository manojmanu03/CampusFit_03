import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import Resume from './pages/Resume.jsx'
import Tests from './pages/Tests.jsx'
import TestPage from './pages/TestPage.jsx'
import Results from './pages/Results.jsx'
import TestTransition from './components/TestTransition.jsx'

export default function App(){
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  const onAuth = (tk) => {
    localStorage.setItem('token', tk)
    setToken(tk)
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/login" element={<Login onAuth={onAuth} />} />
      <Route path="/auth/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/resume" element={<Resume token={token} />} />
      <Route path="/tests" element={<Tests />} />
      <Route path="/test/:type" element={<TestPage token={token} />} />
      <Route path="/test-completed/:completedTest" element={<TestTransition />} />
      <Route path="/results" element={<Results token={token} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
