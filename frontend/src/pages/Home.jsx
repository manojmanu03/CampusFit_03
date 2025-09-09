import React from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout.jsx'

export default function Home(){
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
                <span className="gradient-text">Ace Your</span><br/>
                <span className="text-gray-900">Dream Job</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Transform your career with AI-powered assessments, personalized insights, and comprehensive skill evaluation. Join thousands of students who landed their dream placements.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link to="/auth/register" className="btn-primary text-lg px-8 py-4 animate-pulse-glow">
                  Start Your Journey →
                </Link>
                <Link to="/dashboard" className="btn-secondary text-lg px-8 py-4">
                  Explore Features
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>10,000+ Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>95% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>AI-Powered</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="animate-float">
                <div className="glass-card p-8 hover-lift">
                  <div className="h-80 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid opacity-20"></div>
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-white/20 rounded-lg p-3 mb-3">
                        <div className="h-2 bg-white/40 rounded mb-2"></div>
                        <div className="h-2 bg-white/30 rounded w-3/4"></div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-3 mb-3">
                        <div className="h-2 bg-white/40 rounded mb-2"></div>
                        <div className="h-2 bg-white/30 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 rounded-lg p-4">
                        <div className="text-primary font-bold text-lg">Readiness Score</div>
                        <div className="text-3xl font-extrabold text-gray-900">94%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600">Comprehensive tools designed for placement success</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Analytics</h3>
              <p className="text-gray-600">Get detailed insights into your performance with AI-powered analytics and personalized recommendations.</p>
            </div>
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Skill Assessment</h3>
              <p className="text-gray-600">Comprehensive tests covering aptitude, technical skills, and communication abilities.</p>
            </div>
            <div className="card hover-lift p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Career Boost</h3>
              <p className="text-gray-600">Resume optimization and interview preparation to maximize your placement opportunities.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Career?</h2>
          <p className="text-xl mb-10 text-pink-100">Join thousands of successful students who achieved their dream placements with CampusFit.</p>
          <Link to="/auth/register" className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:scale-105 transition-transform">
            Get Started Free
            <span>→</span>
          </Link>
        </div>
      </section>
    </Layout>
  )
}
