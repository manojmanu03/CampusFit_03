import React from 'react'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function Layout({ children }){
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-pink-50 via-white to-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
