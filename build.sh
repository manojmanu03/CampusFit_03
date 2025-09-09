#!/bin/bash

# Build script for CampusFit deployment

echo "🚀 Starting CampusFit build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p static/uploads
mkdir -p tmp

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy frontend build to static directory
echo "📋 Copying frontend build..."
cp -r frontend/dist/* static/ 2>/dev/null || true

echo "✅ Build completed successfully!"
