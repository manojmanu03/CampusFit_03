#!/bin/bash

# Production startup script for CampusFit

echo "🚀 Starting CampusFit application..."

# Set production environment
export FLASK_ENV=production
export FLASK_DEBUG=False

# Create upload directory if it doesn't exist
mkdir -p /tmp/uploads

# Start the application with Gunicorn
echo "🌐 Starting web server..."
exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 app:app
