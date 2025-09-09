#!/usr/bin/env python3
"""
Simple script to start the CampusFit backend server
"""
import os
import sys
from app import app

if __name__ == '__main__':
    print("Starting CampusFit Backend Server...")
    print("Server will be available at: http://127.0.0.1:5000")
    print("API endpoints will be available at: http://127.0.0.1:5000/api/")
    print("Press Ctrl+C to stop the server")
    
    # Set debug mode for development
    app.run(
        host='127.0.0.1',
        port=5000,
        debug=True,
        threaded=True
    )
