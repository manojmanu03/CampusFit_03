import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Navbar(){
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in by looking for token
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setIsMenuOpen(false)
    navigate('/auth/login')
  }

  const link = (to, label, mobile = false) => (
    <Link 
      to={to} 
      onClick={() => mobile && setIsMenuOpen(false)}
      className={`${mobile ? 'block px-4 py-3 text-lg' : 'px-3 py-2'} rounded-full hover:bg-primary/10 transition-colors ${pathname===to? 'text-primary font-semibold':'text-gray-700'}`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-white/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-extrabold gradient-text">
          CampusFit
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {link('/dashboard','Dashboard')}
              {link('/profile','Profile')}
              {link('/resume','Resume')}
              {link('/tests','Tests')}
              {link('/results','Results')}
            </>
          ) : (
            <>
              {link('/','Home')}
              <Link to="#features" className="px-3 py-2 rounded-full hover:bg-primary/10 text-gray-700">Features</Link>
            </>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-full border border-red-500 text-red-500 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          ) : (
            <>
              <Link className="px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors" to="/auth/login">
                Login
              </Link>
              <Link className="btn-primary" to="/auth/register">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden bg-white/95 backdrop-blur border-t border-gray-200`}>
        <nav className="px-4 py-2 space-y-1">
          {isLoggedIn ? (
            <>
              {link('/dashboard','Dashboard', true)}
              {link('/profile','Profile', true)}
              {link('/resume','Resume', true)}
              {link('/tests','Tests', true)}
              {link('/results','Results', true)}
              <button 
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-lg rounded-full text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {link('/','Home', true)}
              <Link 
                to="#features" 
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-lg rounded-full hover:bg-primary/10 text-gray-700 transition-colors"
              >
                Features
              </Link>
              <div className="px-4 py-3 space-y-3">
                <Link 
                  to="/auth/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-4 py-3 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/auth/register" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center btn-primary"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
