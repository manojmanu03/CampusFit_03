import React from 'react'

export default function Footer(){
  return (
    <footer className="bg-gradient-to-r from-primary to-secondary text-white py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CampusFit</h3>
            <p className="text-pink-100">Your AI-powered placement readiness platform. Get insights, practice tests, and boost your career prospects.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Features</h4>
            <ul className="space-y-2 text-pink-100">
              <li>Resume Analysis</li>
              <li>Aptitude Tests</li>
              <li>Technical Assessment</li>
              <li>Communication Skills</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-pink-100">
              <li>Study Materials</li>
              <li>Interview Tips</li>
              <li>Career Guidance</li>
              <li>Success Stories</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Connect</h4>
            <ul className="space-y-2 text-pink-100">
              <li>LinkedIn</li>
              <li>Twitter</li>
              <li>Discord</li>
              <li>Support</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-pink-300/30 mt-8 pt-6 text-center text-pink-100">
          <p>&copy; 2025 CampusFit. Empowering students for successful placements.</p>
        </div>
      </div>
    </footer>
  )
}
