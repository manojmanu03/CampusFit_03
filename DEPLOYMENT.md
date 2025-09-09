# 🚀 CampusFit Deployment Guide

## Overview
CampusFit is a comprehensive AI-powered placement readiness platform with a Flask backend and React frontend. This guide covers deployment on Render with MongoDB Atlas.

## 📋 Prerequisites
- GitHub account
- Render account  
- MongoDB Atlas account (for production database)
- Domain name (optional, for custom URLs)

## Environment Variables

### Required Environment Variables for Production:
```bash
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
FLASK_SECRET_KEY=your-production-secret-key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/campusfit

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# File Uploads
UPLOAD_FOLDER=/tmp/uploads
MAX_CONTENT_LENGTH=16777216

# CORS (add your production domain)
CORS_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com
```

## Deployment Steps

### 1. Prepare Repository for GitHub

1. **Initialize Git repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CampusFit application"
   ```

2. **Create GitHub repository:**
   - Go to GitHub and create a new repository named `campusfit`
   - Don't initialize with README (we already have files)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/yourusername/campusfit.git
   git branch -M main
   git push -u origin main
   ```

### 2. Set Up MongoDB Atlas

1. **Create MongoDB Atlas cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster (free tier available)
   - Create a database user
   - Whitelist IP addresses (0.0.0.0/0 for production)
   - Get connection string

2. **Import existing data:**
   ```bash
   # If you have local data to migrate
   mongodump --db campusfit
   mongorestore --uri "your-atlas-connection-string" dump/
   ```

### 3. Deploy Backend on Render

1. **Create new Web Service:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service:**
   - **Name:** `campusfit-backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT app:app`

3. **Set Environment Variables:**
   ```
   FLASK_ENV=production
   FLASK_DEBUG=False
   MONGODB_URI=your-atlas-connection-string
   JWT_SECRET_KEY=generate-secure-key
   UPLOAD_FOLDER=/tmp/uploads
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

### 4. Deploy Frontend on Render

1. **Create Static Site:**
   - Click "New" → "Static Site"
   - Connect same GitHub repository

2. **Configure Static Site:**
   - **Name:** `campusfit-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`

3. **Add Redirects:**
   Create `frontend/public/_redirects`:
   ```
   /*    /index.html   200
   ```

### 5. Automated Deployment with render.yaml

The project includes a `render.yaml` file for automated deployment:

1. **Connect Repository to Render:**
   - Go to Render Dashboard
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

2. **Set Environment Variables:**
   Add these in Render's environment variables section:
   ```bash
   FLASK_ENV=production
   FLASK_SECRET_KEY=your-secure-secret-key
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET_KEY=your-jwt-secret-key
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

3. **Frontend Environment:**
   The frontend will automatically use the correct API URL through Vite's environment detection.

## File Structure for Deployment

```
campusfit/
├── api/                    # Backend API modules
├── data/                   # CSV data files
├── frontend/              # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── services/              # Backend services
├── static/                # Static files
├── templates/             # Flask templates
├── utils/                 # Utility functions
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── app.py                # Main Flask application
├── build.sh              # Build script
├── config.py             # Configuration
├── Procfile              # Process file for deployment
├── render.yaml           # Render configuration
├── requirements.txt      # Python dependencies
├── runtime.txt           # Python version
└── start.sh              # Startup script
```

## Production Considerations

### Security
- Use strong, unique JWT secret keys
- Enable HTTPS only in production
- Restrict CORS origins to your domains
- Use environment variables for all secrets

### Performance
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Monitor application performance

### Monitoring
- Set up health checks (`/api/health` endpoint)
- Monitor logs and errors
- Set up alerts for downtime

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check Python version in `runtime.txt`
   - Verify all dependencies in `requirements.txt`
   - Check build logs for specific errors

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist settings
   - Ensure database user has proper permissions

3. **CORS Issues:**
   - Update `CORS_ORIGINS` environment variable
   - Include both frontend and backend URLs

4. **File Upload Issues:**
   - Ensure `UPLOAD_FOLDER` is set to `/tmp/uploads` in production
   - Check file size limits

### Useful Commands:

```bash
# Test production build locally
FLASK_ENV=production python app.py

# Check frontend build
cd frontend && npm run build && npm run preview

# Test with production database
export MONGODB_URI="your-atlas-connection-string"
python app.py
```

## Support

For deployment issues:
1. Check Render logs in dashboard
2. Verify environment variables
3. Test locally with production settings
4. Check GitHub repository permissions

## Updates and Maintenance

### Deploying Updates:
1. Push changes to GitHub main branch
2. Render will automatically redeploy
3. Monitor deployment logs
4. Test functionality after deployment

### Database Migrations:
- Plan schema changes carefully
- Test migrations on staging environment
- Backup production data before major changes
