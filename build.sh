#!/bin/bash

# CampusFit Full-Stack Build Script for Render
echo "🚀 Building CampusFit full-stack application..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js and build React frontend
echo "⚛️ Building React frontend..."
cd frontend

# Install frontend dependencies
npm install

# Build React app for production
npm run build

# Go back to root directory
cd ..

# Create production directories
echo "📁 Setting up production directories..."
mkdir -p /tmp/uploads

# Verify build
if [ -d "frontend/dist" ]; then
    echo "✅ Frontend build successful!"
    echo "📊 Build size:"
    du -sh frontend/dist
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Full-stack build completed successfully!"
echo "🌐 Ready to serve React frontend from Flask backend"

# Copy frontend build to static directory
echo "📋 Copying frontend build..."
cp -r frontend/dist/* static/ 2>/dev/null || true

echo "✅ Build completed successfully!"
