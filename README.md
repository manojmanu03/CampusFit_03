# CampusFit - AI-Powered Campus Placement Platform

CampusFit is a comprehensive web application that helps students assess their placement readiness through AI-powered analysis. The platform provides technical assessments, resume analysis, and personalized predictions to maximize placement success.

## 🚀 Features

### **Smart Resume Analysis**
- AI-powered resume scoring with job-specific analysis
- ATS compatibility checking
- Real-time content extraction and feedback
- Job description matching for targeted insights

### **Comprehensive Assessments**
- Technical Skills Assessment (30 minutes)
- Communication Skills Assessment (30 minutes) 
- Aptitude Test (30 minutes)
- Timed test environment with progress tracking

### **ML-Based Predictions**
- Placement probability prediction
- Company fit analysis
- Personalized recommendations
- Performance analytics and insights

### **Modern User Experience**
- Responsive React frontend
- Interactive dashboard with progress tracking
- Real-time processing with transparency
- Mobile-friendly design

## 🛠 Tech Stack

- **Backend**: Python, Flask, MongoDB
- **Frontend**: React, Vite, TailwindCSS
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **Authentication**: JWT, bcrypt
- **Deployment**: Render, GitHub
- **Database**: MongoDB Atlas

## 📁 Project Structure

```
CampusFit/
├── 🐍 Backend (Python/Flask)
│   ├── app.py                    # Main Flask application
│   ├── config.py                 # Configuration management
│   ├── api/                      # API endpoints
│   │   ├── auth.py              # Authentication routes
│   │   ├── profile.py           # User profile management
│   │   ├── questions.py         # Assessment questions
│   │   └── resume.py            # Resume analysis
│   ├── utils/                   # Utility functions
│   │   ├── auth.py              # Authentication helpers
│   │   ├── jwt_utils.py         # JWT token management
│   │   └── job_matching.py      # Job matching algorithms
│   ├── services/                # Business logic
│   │   ├── mongo_client.py      # Database connection
│   │   └── mailer.py            # Email services
│   └── data/                    # CSV datasets
├── ⚛️ Frontend (React/Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Application pages
│   │   ├── lib/                 # Utility libraries
│   │   └── App.jsx              # Main React app
│   ├── public/                  # Static assets
│   └── package.json             # Frontend dependencies
├── 🚀 Deployment
│   ├── render.yaml              # Render deployment config
│   ├── build.sh                 # Build script
│   ├── start.sh                 # Production startup
│   └── .env.example             # Environment template
└── 🤖 ML Models
    ├── placement_model.pkl       # Placement prediction
    ├── company_fit_model.pkl     # Company matching
    └── scaler.pkl               # Feature scaling
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- MongoDB Atlas account (for production)

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/CampusFit.git
cd CampusFit
```

2. **Backend setup:**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Start backend server
python app.py
```

3. **Frontend setup:**
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev
```

4. **Access the application:**
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## 🌐 Deployment

### Render Deployment (Recommended)

1. **Prepare your repository:**
```bash
# Ensure all files are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Deploy to Render:**
- Connect your GitHub repository to Render
- The `render.yaml` file will automatically configure services
- Set environment variables in Render dashboard

3. **Environment Variables:**
```env
FLASK_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET_KEY=your_secure_jwt_secret
FLASK_SECRET_KEY=your_flask_secret_key
```

### Manual Deployment

```bash
# Build the application
chmod +x build.sh
./build.sh

# Start production server
chmod +x start.sh
./start.sh
```

## 🤖 Machine Learning Models

- **`placement_model.pkl`**: Predicts placement probability based on assessment scores
- **`company_fit_model.pkl`**: Analyzes compatibility with different company types
- **`scaler.pkl`**: Normalizes features for consistent model predictions

## 📊 Assessment Data

- **`Apquestions.csv`**: 50+ aptitude questions with difficulty levels
- **`CommunicationAssess.csv`**: Communication skills evaluation
- **`TechnicalQuestions.csv`**: Technical assessment database
- **`loginUsers.csv`**: User authentication records

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Machine Learning community for model training resources
- React and Flask communities for excellent documentation
- Contributors who helped improve the platform