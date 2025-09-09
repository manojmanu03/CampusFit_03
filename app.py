from flask import Flask, render_template, request, redirect, url_for, session, render_template_string, send_from_directory
from flask_cors import CORS
import os
import csv
from werkzeug.utils import secure_filename
import random
import secrets
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from typing import Optional
from pdfminer.high_level import extract_text
import docx
import docx2txt
import PyPDF2
import tempfile
from typing import Optional

from config import settings
from api.auth import auth_bp
from api.questions import questions_bp
from api.profile import profile_bp
from api.resume import resume_bp
from api.tests import tests_bp
from api.results import results_bp
from services.mailer import send_email as brevo_send_email

app = Flask(__name__, template_folder='templates', static_folder='frontend/dist', static_url_path='')
app.secret_key = settings.FLASK_SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = settings.MAX_CONTENT_LENGTH

# Core config
os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = settings.UPLOAD_FOLDER
app.config['RESET_TOKEN_EXPIRATION'] = 3600
app.config['MAX_CONTENT_LENGTH'] = settings.MAX_CONTENT_LENGTH

# Enable CORS for API routes with dynamic origins
CORS(
    app,
    resources={r"/api/*": {
        "origins": settings.CORS_ORIGINS,
        "supports_credentials": True,
        "allow_headers": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "max_age": 86400,
    }}
)
latest_resume_score = None

# Ensure the upload folder exists
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}

# Register API blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(questions_bp)
app.register_blueprint(profile_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(tests_bp)
app.register_blueprint(results_bp)

# Utility functions
def user_exists(username):
    if not os.path.exists('data/loginUsers.csv'):
        return False
    with open('data/loginUsers.csv', 'r') as file:
        return any(row and row[0] == username for row in csv.reader(file))

def register_user(username, password, email):
    with open('data/loginUsers.csv', 'a', newline='') as file:
        csv.writer(file).writerow([username, password, email])

def authenticate_user(username, password):
    if not os.path.exists('data/loginUsers.csv'):
        return False
    with open('data/loginUsers.csv', 'r') as file:
        return any(row and row[0] == username and row[1] == password for row in csv.reader(file))

def get_user_email(username):
    with open('data/loginUsers.csv', 'r') as file:
        for row in csv.reader(file):
            if row and row[0] == username:
                return row[2] if len(row) > 2 else None
    return None

def update_user_password(username, new_password):
    rows = []
    with open('data/loginUsers.csv', 'r') as file:
        rows = list(csv.reader(file))
    with open('data/loginUsers.csv', 'w', newline='') as file:
        writer = csv.writer(file)
        for row in rows:
            if row and row[0] == username:
                row[1] = new_password
            writer.writerow(row)
    return True

def generate_reset_token(username):
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now() + timedelta(seconds=app.config['RESET_TOKEN_EXPIRATION'])
    session['reset_tokens'] = session.get('reset_tokens', {})
    session['reset_tokens'][token] = {'username': username, 'expires_at': expires_at.timestamp()}
    return token

def validate_reset_token(token):
    token_data = session.get('reset_tokens', {}).get(token)
    if not token_data or datetime.now().timestamp() > token_data['expires_at']:
        session.get('reset_tokens', {}).pop(token, None)
        return None
    return token_data['username']

def send_reset_email(email, token):
    reset_url = url_for('reset_password', token=token, _external=True)
    html = f"""
        <p>You requested a password reset for CampusFit.</p>
        <p><a href='{reset_url}' style='background:#970747;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;'>Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
    """
    return brevo_send_email(to_email=email, subject='Password Reset', html_content=html)


def load_questions(filename, count=10, delimiter=','):
    questions = []
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.reader(file, delimiter=delimiter)
            next(reader, None)  # Skip header
            for row in reader:
                if len(row) >= 6:
                    # Map the correct answer (a,b,c,d) to the corresponding option index
                    answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3}
                    correct_answer = row[5].strip().lower()
                    correct_option = ''
                    
                    # Get the correct option based on the letter answer
                    if correct_answer in answer_map:
                        option_index = answer_map[correct_answer]
                        if option_index < len(row[1:5]):
                            correct_option = row[1 + option_index].strip()
                    
                    questions.append({
                        'question': row[0].strip(),
                        'options': [row[1].strip(), row[2].strip(), row[3].strip(), row[4].strip()],
                        'correct': correct_option,
                        'correct_letter': correct_answer
                    })
    except Exception as e:
        print(f"Error loading questions from {filename}: {e}")
        return []
    
    return random.sample(questions, min(count, len(questions)))

def calculate_score(answers, correct_answers):
    score = 0
    selected_answers = {}
    
    for q_num, user_answer in answers.items():
        correct = correct_answers.get(q_num)
        if correct and user_answer:
            selected_answers[q_num] = {
                'selected': user_answer,
                'correct': correct
            }
            if user_answer.strip() == correct.strip():
                score += 1
                
    return score, selected_answers

def extract_resume_text(filepath: str) -> str:
    """Extract text from resume file."""
    ext = filepath.rsplit('.', 1)[1].lower()
    try:
        if ext == 'pdf':
            return extract_text(filepath)
        elif ext in ['doc', 'docx']:
            return docx2txt.process(filepath)
        return ''
    except Exception as e:
        print(f"Error extracting text from resume: {e}")
        return ''

def analyze_resume_quality(text: str, filename: str) -> float:
    """Analyze resume quality and return score out of 10."""
    if not text:
        return 0.0
        
    score = 0
    text_lower = text.lower()
    word_count = len(text.split())
    
    # Cache commonly used calculations
    bullet_count = text.count("•") + text.count("- ") + text.count("* ")
    
    # --- 1. Quick Format Check (2 points) ---
    ext = filename.rsplit('.', 1)[1].lower()
    if ext in ['pdf', 'doc', 'docx'] and 200 <= word_count <= 1500:
        score += 2 if 200 <= word_count <= 1200 else 1
    
    # --- 2. Essential Sections Check (3 points) ---
    essential_sections = {'education': 1.0, 'experience': 1.0, 'skills': 1.0}
    score += sum(weight for section, weight in essential_sections.items() 
                if section in text_lower)
    
    # --- 3. Structure Quality (2 points) ---
    if bullet_count >= 8:
        score += 2
    elif bullet_count >= 4:
        score += 1
    
    # --- 4. Key Terms Analysis (3 points) ---
    key_terms = {
        # High impact terms (0.5 each)
        'project': 0.5, 'develop': 0.5, 'lead': 0.5, 'manage': 0.5,
        # Medium impact terms (0.25 each)
        'implement': 0.25, 'create': 0.25, 'design': 0.25, 'analyze': 0.25
    }
    
    term_score = sum(weight for term, weight in key_terms.items() 
                    if term in text_lower)
    score += min(3, term_score)
    
    return round(min(10, score), 1)

def score_resume(text):
    score = 0
    keywords = ['project', 'intern', 'python', 'leadership', 'machine learning', 'communication']
    for keyword in keywords:
        if keyword.lower() in text.lower():
            score += 10
    return min(score, 100)
def calculate_readiness_score(data: dict) -> float:
    """Calculate placement readiness score efficiently."""
    # Pre-defined weights for different components
    weights = {
        'aptitude_score': 0.3,
        'technical_score': 0.4,
        'communication_score': 0.2,
        'resume_score': 0.1
    }
    
    # Quick calculation using dictionary comprehension
    scaled_scores = {
        k: float(data.get(k, 0)) * 10 
        for k in weights.keys()
    }
    
    # Calculate weighted sum
    total_score = sum(scaled_scores[k] * w for k, w in weights.items())
    return min(100, max(0, total_score))

def generate_feedback(data: dict) -> list:
    """Generate focused feedback based on scores."""
    feedback = []
    
    # Convert scores to percentages once
    scores = {
        'aptitude': float(data.get('aptitude_score', 0)) * 10,
        'technical': float(data.get('technical_score', 0)) * 10,
        'communication': float(data.get('communication_score', 0)) * 10,
        'resume': float(data.get('resume_score', 0)) * 10
    }
    
    # Critical checks first (most important factors)
    if data.get('cgpa', 0) < 7.5:
        feedback.append(f"Priority: Improve CGPA (current: {data['cgpa']})")
    
    if data.get('backlogs', 0) > 0:
        feedback.append(f"Critical: Clear {data['backlogs']} backlogs")
    
    # Score-based feedback (threshold 70%)
    score_feedback = {
        'aptitude': "Practice more aptitude questions and mock tests",
        'technical': "Focus on strengthening technical skills",
        'communication': "Enhance communication skills through practice",
        'resume': "Improve resume content and structure"
    }
    
    feedback.extend(f"Improve: {msg}" for score_type, msg in score_feedback.items() 
                   if scores.get(score_type, 0) < 70)
    
    # Quick checks for additional qualifications
    if int(data.get('projects', 0)) < 2:
        feedback.append("Add: Work on more technical projects")
    
    if int(data.get('certifications', 0)) < 1:
        feedback.append("Add: Pursue relevant certifications")
    
    return feedback if feedback else ["✅ Great progress! Keep maintaining your performance!"]

# Routes
@app.route('/')
def home():
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        if authenticate_user(username, password):
            session['username'] = username
            return redirect(url_for('dashboard'))
        return render_template('login.html', error="Invalid credentials")
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        email = request.form.get('email')
        if not all([username, password, email]):
            return render_template('register.html', error="All fields ")
        if user_exists(username):
            return render_template('register.html', error="Username exists")
        register_user(username, password, email)
        return redirect(url_for('home'))
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html', username=session['username'])



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route('/upload_resume', methods=['GET', 'POST'])
def upload_resume():
    if 'username' not in session:
        return redirect(url_for('login'))

    global latest_resume_score  # Declare you're using/modifying the global variable
    resume_score = None

    if request.method == 'POST':
        file = request.files.get('resume')
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            file.save(filepath)
            
            text = extract_resume_text(filepath)
            if text:
                resume_score = analyze_resume_quality(text, filename)
                session['resume_score'] = resume_score
                latest_resume_score = resume_score
                
                # Clean up the uploaded file
                try:
                    os.remove(filepath)
                except:
                    pass
                    
                return render_template('resume_upload.html', resume_score=resume_score)
            else:
                return render_template('resume_upload.html', resume_score=None, error="Could not extract text from resume")
        else:
            return render_template('resume_upload.html', resume_score=None, error="Invalid file format")

    return render_template('resume_upload.html', resume_score=session.get('resume_score'))


@app.route('/input_parameters', methods=['GET', 'POST'])
def input_parameters():
    if 'username' not in session:
        return redirect(url_for('login'))
    if request.method == 'POST':
        # Get form values with proper error handling
        try:
            cgpa_value = request.form.get('cgpa', '')
            session['cgpa'] = float(cgpa_value) if cgpa_value else 0.0
            
            backlogs_value = request.form.get('backlogs', '')
            session['backlogs'] = int(backlogs_value) if backlogs_value else 0
            
            hackathons_value = request.form.get('hackathons', '')
            session['hackathons'] = int(hackathons_value) if hackathons_value else 0
            
            certificates_value = request.form.get('certificates', '')
            session['certificates'] = int(certificates_value) if certificates_value else 0
            
            internship_value = request.form.get('internship', '')
            session['internship'] = int(internship_value) if internship_value else 0
            
            projects_value = request.form.get('Projects', '')
            session['Projects'] = int(projects_value) if projects_value else 0
            
            session['Branch'] = request.form.get('Branch', '').strip()
            
        except (ValueError, TypeError) as e:
            print(f"Error processing form data: {e}")
            # Set default values if there's an error
            session['cgpa'] = 0.0
            session['backlogs'] = 0
            session['hackathons'] = 0
            session['certificates'] = 0
            session['internship'] = 0
            session['Projects'] = 0
            session['Branch'] = ''
        
        session.modified = True
        return redirect(url_for('test_confirmation'))
    return render_template('input_parameters.html')


@app.route('/test_confirmation', methods=['GET', 'POST'])
def test_confirmation():
    if 'username' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        if request.form.get('action') == 'confirm':
            return redirect(url_for('aptitude_test'))
        return redirect(url_for('input_parameters'))
    
    return render_template(
        'test_confirmation.html',
        username=session.get('username'),
        cgpa=session.get('cgpa', 0),
        backlogs=session.get('backlogs', 0),
        hackathons=session.get('hackathons', 0),
        certificates=session.get('certificates', 0),
        internship=session.get('internship', 0),
        Projects=session.get('Projects', 0),       
        Branch=session.get('Branch', '')        
    )


@app.route('/aptitude_test', methods=['GET', 'POST'])
def aptitude_test():
    if 'username' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        # Get all answers from the form
        user_answers = {f'q{i}': request.form.get(f'q{i}') for i in range(1, 11)}
        correct_answers = {f'q{i}': session.get(f'aptitude_q{i}_answer') for i in range(1, 11)}
        
        score, selected_answers = calculate_score(user_answers, correct_answers)
        
        # Store results in session
        session['aptitude_score'] = score
        session['aptitude_answers'] = selected_answers
        if 'tests' not in session:
            session['tests'] = {}
        session['tests']['aptitude'] = score
        session.modified = True
        
        print(f"Aptitude Test Score: {score}/10")
        return redirect(url_for('technical_test'))

    questions = load_questions('data/Apquestions.csv', count=10, delimiter=';')
    
    # Store correct answers in session
    for i, q in enumerate(questions, 1):
        session[f'aptitude_q{i}_answer'] = q['correct']
        session[f'aptitude_q{i}_letter'] = q['correct_letter']
    
    # Add test section information to the template
    test_sections = {
        'aptitude_test': {'current': 'Aptitude', 'next': 'technical_test', 'next_name': 'Technical'},
        'technical_test': {'current': 'Technical', 'next': 'communication_test', 'next_name': 'Communication'},
        'communication_test': {'current': 'Communication', 'next': 'results', 'next_name': 'Results'}
    }
    
    current_route = request.endpoint
    section_info = test_sections.get(current_route, {})
    
    form_html = '''
        <form method="post" id="test-form" class="test-form">
            <div class="test-section-info">
                <span class="current-section">{{ section_info.get('current', '') }} Test</span>
                <span class="next-section">Next: {{ section_info.get('next_name', '') }} Test</span>
            </div>
            
            <div class="progress-dots">
                {% for i in range(10) %}
                <div class="dot" data-question="{{ i + 1 }}"></div>
                {% endfor %}
            </div>
            
            {% for i in range(10) %}
            <div class="question-container{% if i == 0 %} active{% endif %}" id="question-{{ i + 1 }}">
                <div class="question-header">
                    <span class="question-number">Question {{ i + 1 }}</span>
                </div>
                
                <p class="question-text">{{ questions[i].question }}</p>
                
                <div class="options-container">
                    {% for option in questions[i].options %}
                    <label class="option-label">
                        <input type="radio" name="q{{ i + 1 }}" value="{{ option }}">
                        <span class="option-text">{{ option }}</span>
                    </label>
                    {% endfor %}
                </div>
                
            </div>
            {% endfor %}
            
            <div class="navigation-controls">
                <button type="button" class="nav-btn prev-btn" id="prev-btn" disabled>
                    <i class="fas fa-arrow-left"></i>
                    Previous
                </button>
                
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <span class="progress-text">
                        Question <span id="current-question">1</span> of 10
                    </span>
                </div>
                
                <button type="button" class="nav-btn next-btn" id="next-btn">
                    Next
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            
            <button type="submit" class="submit-btn" id="submit-btn">
                <i class="fas fa-check-circle"></i>
                Submit {{ section_info.get('current', '') }} Test
            </button>
        </form>
    '''

    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{ section_info.get('current', '') }} Assessment</title>
        <link rel="stylesheet" href="{{ url_for('static', filename='css/test_style.css') }}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div class="timer-container">
            <i class="fas fa-clock"></i>
            <span id="timer">10:00</span>
        </div>

        <div class="test-container">
            <div class="test-header">
                <h1>{{ section_info.get('current', '') }} Assessment</h1>
                <p>Answer the questions. You can skip questions if needed.</p>
            </div>
            
            ''' + form_html + '''
        </div>
        
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                // Timer functionality
                var timeLeft = 10 * 60; // 10 minutes in seconds
                var timerDisplay = document.getElementById("timer");
                var timerContainer = document.querySelector(".timer-container");
                
                function updateTimer() {
                    var minutes = Math.floor(timeLeft / 60);
                    var seconds = timeLeft % 60;
                    timerDisplay.textContent = 
                        (minutes < 10 ? "0" : "") + minutes + ":" + 
                        (seconds < 10 ? "0" : "") + seconds;
                        
                    if (timeLeft > 0) {
                        timeLeft--;
                        setTimeout(updateTimer, 1000);
                        
                        // Add warning class when less than 2 minutes remaining
                        if (timeLeft <= 120) {
                            timerContainer.classList.add('timer-warning');
                        }
                    } else {
                        // Auto-submit when time is up
                        document.getElementById("test-form").submit();
                    }
                }
                
                // Start the timer
                updateTimer();
                
                var form = document.getElementById("test-form");
                var progressFill = document.getElementById("progress-fill");
                var currentQuestionSpan = document.getElementById("current-question");
                var prevBtn = document.getElementById("prev-btn");
                var nextBtn = document.getElementById("next-btn");
                var submitBtn = document.getElementById("submit-btn");
                var dots = document.querySelectorAll(".dot");
                var questions = document.querySelectorAll(".question-container");
                
                var currentQuestion = 1;
                
                // Question navigation
                function updateNavigation() {
                    prevBtn.disabled = currentQuestion === 1;
                    nextBtn.textContent = currentQuestion === 10 ? "Review" : "Next";
                    currentQuestionSpan.textContent = currentQuestion;
                    
                    // Update progress bar
                    var progress = (currentQuestion / 10) * 100;
                    if (progressFill) {
                        progressFill.style.width = progress + "%";
                    }
                    
                    // Update dots
                    dots.forEach(function(dot, index) {
                        dot.classList.remove("active");
                        if (index + 1 === currentQuestion) {
                            dot.classList.add("active");
                        }
                        
                        var questionInput = document.querySelector("#question-" + (index + 1) + " input:checked");
                        if (questionInput) {
                            dot.classList.add("answered");
                        }
                    });
                }
                
                function showQuestion(questionNumber) {
                    questions.forEach(function(q) {
                        q.classList.remove("active");
                    });
                    document.getElementById("question-" + questionNumber).classList.add("active");
                    currentQuestion = questionNumber;
                    updateNavigation();
                }
                
                // Event listeners
                prevBtn.addEventListener("click", function() {
                    if (currentQuestion > 1) {
                        showQuestion(currentQuestion - 1);
                    }
                });
                
                nextBtn.addEventListener("click", function() {
                    if (currentQuestion < 10) {
                        showQuestion(currentQuestion + 1);
                    }
                });
                
                dots.forEach(function(dot, index) {
                    dot.addEventListener("click", function() {
                        showQuestion(index + 1);
                    });
                });
                
                // Handle radio button changes
                document.querySelectorAll("input[type='radio']").forEach(function(radio) {
                    radio.addEventListener("change", function() {
                        var questionNumber = parseInt(this.name.replace("q", ""));
                        dots[questionNumber - 1].classList.add("answered");
                        
                        // Auto-advance to next question if not on last question
                        if (currentQuestion < 10) {
                            setTimeout(function() {
                                showQuestion(currentQuestion + 1);
                            }, 500);
                        }
                        
                        updateNavigation();
                    });
                });
                
                // Initialize navigation
                updateNavigation();
            });
        </script>
    </body>
    </html>
    ''', questions=questions, section_info=section_info)


@app.route('/technical_test', methods=['GET', 'POST'])
def technical_test():
    if 'username' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        user_answers = {f'q{i}': request.form.get(f'q{i}') for i in range(1, 11)}
        correct_answers = {f'q{i}': session.get(f'technical_q{i}_answer') for i in range(1, 11)}
        
        score, selected_answers = calculate_score(user_answers, correct_answers)
        
        # Store results in session
        session['technical_score'] = score
        session['technical_answers'] = selected_answers
        if 'tests' not in session:
            session['tests'] = {}
        session['tests']['technical'] = score
        session.modified = True
        
        print(f"Technical Test Score: {score}/10")
        return redirect(url_for('communication_test'))

    questions = load_questions('data/TechnicalQuestions.csv', count=10)
    
    # Store correct answers in session
    for i, q in enumerate(questions, 1):
        session[f'technical_q{i}_answer'] = q['correct']
        session[f'technical_q{i}_letter'] = q['correct_letter']
    
    # Add test section information to the template
    test_sections = {
        'aptitude_test': {'current': 'Aptitude', 'next': 'technical_test', 'next_name': 'Technical'},
        'technical_test': {'current': 'Technical', 'next': 'communication_test', 'next_name': 'Communication'},
        'communication_test': {'current': 'Communication', 'next': 'results', 'next_name': 'Results'}
    }
    
    current_route = request.endpoint
    section_info = test_sections.get(current_route, {})
    
    form_html = '''
        <form method="post" id="test-form" class="test-form">
            <div class="test-section-info">
                <span class="current-section">{{ section_info.get('current', '') }} Test</span>
            </div>
            
            <div class="progress-dots">
                {% for i in range(10) %}
                <div class="dot" data-question="{{ i + 1 }}"></div>
                {% endfor %}
            </div>
            
            {% for i in range(10) %}
            <div class="question-container{% if i == 0 %} active{% endif %}" id="question-{{ i + 1 }}">
                <div class="question-header">
                    <span class="question-number">Question {{ i + 1 }}</span>
                </div>
                
                <p class="question-text">{{ questions[i].question }}</p>
                
                <div class="options-container">
                    {% for option in questions[i].options %}
                    <label class="option-label">
                        <input type="radio" name="q{{ i + 1 }}" value="{{ option }}">
                        <span class="option-text">{{ option }}</span>
                    </label>
                    {% endfor %}
                </div>
            </div>
            {% endfor %}
            
            <div class="navigation-controls">
                <button type="button" class="nav-btn prev-btn" id="prev-btn" disabled>
                    <i class="fas fa-arrow-left"></i>
                    Previous
                </button>
                
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <span class="progress-text">
                        Question <span id="current-question">1</span> of 10
                    </span>
                </div>
                
                <button type="button" class="nav-btn next-btn" id="next-btn">
                    Next
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            
            <button type="submit" class="submit-btn" id="submit-btn">
                <i class="fas fa-check-circle"></i>
                Submit {{ section_info.get('current', '') }} Test
            </button>
        </form>
    '''

    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{ section_info.get('current', '') }} Assessment</title>
        <link rel="stylesheet" href="{{ url_for('static', filename='css/test_style.css') }}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div class="timer-container">
            <i class="fas fa-clock"></i>
            <span id="timer">10:00</span>
        </div>

        <div class="test-container">
            <div class="test-header">
                <h1>{{ section_info.get('current', '') }} Assessment</h1>
                <p>Answer the questions. You can skip questions if needed.</p>
            </div>
            
            ''' + form_html + '''
        </div>
        
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                // Timer functionality
                var timeLeft = 10 * 60; // 10 minutes in seconds
                var timerDisplay = document.getElementById("timer");
                var timerContainer = document.querySelector(".timer-container");
                
                function updateTimer() {
                    var minutes = Math.floor(timeLeft / 60);
                    var seconds = timeLeft % 60;
                    timerDisplay.textContent = 
                        (minutes < 10 ? "0" : "") + minutes + ":" + 
                        (seconds < 10 ? "0" : "") + seconds;
                        
                    if (timeLeft > 0) {
                        timeLeft--;
                        setTimeout(updateTimer, 1000);
                        
                        // Add warning class when less than 2 minutes remaining
                        if (timeLeft <= 120) {
                            timerContainer.classList.add('timer-warning');
                        }
                    } else {
                        // Auto-submit when time is up
                        document.getElementById("test-form").submit();
                    }
                }
                
                // Start the timer
                updateTimer();
                
                var form = document.getElementById("test-form");
                var progressFill = document.getElementById("progress-fill");
                var currentQuestionSpan = document.getElementById("current-question");
                var prevBtn = document.getElementById("prev-btn");
                var nextBtn = document.getElementById("next-btn");
                var submitBtn = document.getElementById("submit-btn");
                var dots = document.querySelectorAll(".dot");
                var questions = document.querySelectorAll(".question-container");
                
                var currentQuestion = 1;
                
                // Question navigation
                function updateNavigation() {
                    prevBtn.disabled = currentQuestion === 1;
                    nextBtn.textContent = currentQuestion === 10 ? "Review" : "Next";
                    currentQuestionSpan.textContent = currentQuestion;
                    
                    // Update progress bar
                    var progress = (currentQuestion / 10) * 100;
                    if (progressFill) {
                        progressFill.style.width = progress + "%";
                    }
                    
                    // Update dots
                    dots.forEach(function(dot, index) {
                        dot.classList.remove("active");
                        if (index + 1 === currentQuestion) {
                            dot.classList.add("active");
                        }
                        
                        var questionInput = document.querySelector("#question-" + (index + 1) + " input:checked");
                        if (questionInput) {
                            dot.classList.add("answered");
                        }
                    });
                }
                
                function showQuestion(questionNumber) {
                    questions.forEach(function(q) {
                        q.classList.remove("active");
                    });
                    document.getElementById("question-" + questionNumber).classList.add("active");
                    currentQuestion = questionNumber;
                    updateNavigation();
                }
                
                // Event listeners
                prevBtn.addEventListener("click", function() {
                    if (currentQuestion > 1) {
                        showQuestion(currentQuestion - 1);
                    }
                });
                
                nextBtn.addEventListener("click", function() {
                    if (currentQuestion < 10) {
                        showQuestion(currentQuestion + 1);
                    }
                });
                
                dots.forEach(function(dot, index) {
                    dot.addEventListener("click", function() {
                        showQuestion(index + 1);
                    });
                });
                
                // Handle radio button changes
                document.querySelectorAll("input[type='radio']").forEach(function(radio) {
                    radio.addEventListener("change", function() {
                        var questionNumber = parseInt(this.name.replace("q", ""));
                        dots[questionNumber - 1].classList.add("answered");
                        
                        // Auto-advance to next question if not on last question
                        if (currentQuestion < 10) {
                            setTimeout(function() {
                                showQuestion(currentQuestion + 1);
                            }, 500);
                        }
                        
                        updateNavigation();
                    });
                });
                
                // Initialize navigation
                updateNavigation();
            });
        </script>
    </body>
    </html>
    ''', questions=questions, section_info=section_info)


@app.route('/communication_test', methods=['GET', 'POST'])
def communication_test():
    if 'username' not in session:
        return redirect(url_for('login'))

    if request.method == 'POST':
        user_answers = {f'q{i}': request.form.get(f'q{i}') for i in range(1, 11)}
        correct_answers = {f'q{i}': session.get(f'communication_q{i}_answer') for i in range(1, 11)}
        
        score, selected_answers = calculate_score(user_answers, correct_answers)
        
        # Store results in session
        session['communication_score'] = score
        session['communication_answers'] = selected_answers
        if 'tests' not in session:
            session['tests'] = {}
        session['tests']['communication'] = score
        session.modified = True
        
        print(f"Communication Test Score: {score}/10")
        return redirect(url_for('results'))

    questions = load_questions('data/CommunicationAssess.csv', count=10)
    
    # Store correct answers in session
    for i, q in enumerate(questions, 1):
        session[f'communication_q{i}_answer'] = q['correct']
        session[f'communication_q{i}_letter'] = q['correct_letter']
    
    # Add test section information to the template
    test_sections = {
        'aptitude_test': {'current': 'Aptitude', 'next': 'technical_test', 'next_name': 'Technical'},
        'technical_test': {'current': 'Technical', 'next': 'communication_test', 'next_name': 'Communication'},
        'communication_test': {'current': 'Communication', 'next': 'results', 'next_name': 'Results'}
    }
    
    current_route = request.endpoint
    section_info = test_sections.get(current_route, {})
    
    form_html = '''
        <form method="post" id="test-form" class="test-form">
            <div class="test-section-info">
                <span class="current-section">{{ section_info.get('current', '') }} Test</span>
            </div>
            
            <div class="progress-dots">
                {% for i in range(10) %}
                <div class="dot" data-question="{{ i + 1 }}"></div>
                {% endfor %}
            </div>
            
            {% for i in range(10) %}
            <div class="question-container{% if i == 0 %} active{% endif %}" id="question-{{ i + 1 }}">
                <div class="question-header">
                    <span class="question-number">Question {{ i + 1 }}</span>
                </div>
                
                <p class="question-text">{{ questions[i].question }}</p>
                
                <div class="options-container">
                    {% for option in questions[i].options %}
                    <label class="option-label">
                        <input type="radio" name="q{{ i + 1 }}" value="{{ option }}">
                        <span class="option-text">{{ option }}</span>
                    </label>
                    {% endfor %}
                </div>
            </div>
            {% endfor %}
            
            <div class="navigation-controls">
                <button type="button" class="nav-btn prev-btn" id="prev-btn" disabled>
                    <i class="fas fa-arrow-left"></i>
                    Previous
                </button>
                
                <div class="progress-indicator">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <span class="progress-text">
                        Question <span id="current-question">1</span> of 10
                    </span>
                </div>
                
                <button type="button" class="nav-btn next-btn" id="next-btn">
                    Next
                    <i class="fas fa-arrow-right"></i>
                </button>
            </div>
            
            <button type="submit" class="submit-btn" id="submit-btn">
                <i class="fas fa-check-circle"></i>
                Submit {{ section_info.get('current', '') }} Test
            </button>
        </form>
    '''

    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <title>{{ section_info.get('current', '') }} Assessment</title>
        <link rel="stylesheet" href="{{ url_for('static', filename='css/test_style.css') }}">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div class="timer-container">
            <i class="fas fa-clock"></i>
            <span id="timer">10:00</span>
        </div>

        <div class="test-container">
            <div class="test-header">
                <h1>{{ section_info.get('current', '') }} Assessment</h1>
                <p>Answer the questions. You can skip questions if needed.</p>
            </div>
            
            ''' + form_html + '''
        </div>
        
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                // Timer functionality
                var timeLeft = 10 * 60; // 10 minutes in seconds
                var timerDisplay = document.getElementById("timer");
                var timerContainer = document.querySelector(".timer-container");
                
                function updateTimer() {
                    var minutes = Math.floor(timeLeft / 60);
                    var seconds = timeLeft % 60;
                    timerDisplay.textContent = 
                        (minutes < 10 ? "0" : "") + minutes + ":" + 
                        (seconds < 10 ? "0" : "") + seconds;
                        
                    if (timeLeft > 0) {
                        timeLeft--;
                        setTimeout(updateTimer, 1000);
                        
                        // Add warning class when less than 2 minutes remaining
                        if (timeLeft <= 120) {
                            timerContainer.classList.add('timer-warning');
                        }
                    } else {
                        // Auto-submit when time is up
                        document.getElementById("test-form").submit();
                    }
                }
                
                // Start the timer
                updateTimer();
                
                var form = document.getElementById("test-form");
                var progressFill = document.getElementById("progress-fill");
                var currentQuestionSpan = document.getElementById("current-question");
                var prevBtn = document.getElementById("prev-btn");
                var nextBtn = document.getElementById("next-btn");
                var submitBtn = document.getElementById("submit-btn");
                var dots = document.querySelectorAll(".dot");
                var questions = document.querySelectorAll(".question-container");
                
                var currentQuestion = 1;
                
                // Question navigation
                function updateNavigation() {
                    prevBtn.disabled = currentQuestion === 1;
                    nextBtn.textContent = currentQuestion === 10 ? "Review" : "Next";
                    currentQuestionSpan.textContent = currentQuestion;
                    
                    // Update progress bar
                    var progress = (currentQuestion / 10) * 100;
                    if (progressFill) {
                        progressFill.style.width = progress + "%";
                    }
                    
                    // Update dots
                    dots.forEach(function(dot, index) {
                        dot.classList.remove("active");
                        if (index + 1 === currentQuestion) {
                            dot.classList.add("active");
                        }
                        
                        var questionInput = document.querySelector("#question-" + (index + 1) + " input:checked");
                        if (questionInput) {
                            dot.classList.add("answered");
                        }
                    });
                }
                
                function showQuestion(questionNumber) {
                    questions.forEach(function(q) {
                        q.classList.remove("active");
                    });
                    document.getElementById("question-" + questionNumber).classList.add("active");
                    currentQuestion = questionNumber;
                    updateNavigation();
                }
                
                // Event listeners
                prevBtn.addEventListener("click", function() {
                    if (currentQuestion > 1) {
                        showQuestion(currentQuestion - 1);
                    }
                });
                
                nextBtn.addEventListener("click", function() {
                    if (currentQuestion < 10) {
                        showQuestion(currentQuestion + 1);
                    }
                });
                
                dots.forEach(function(dot, index) {
                    dot.addEventListener("click", function() {
                        showQuestion(index + 1);
                    });
                });
                
                // Handle radio button changes
                document.querySelectorAll("input[type='radio']").forEach(function(radio) {
                    radio.addEventListener("change", function() {
                        var questionNumber = parseInt(this.name.replace("q", ""));
                        dots[questionNumber - 1].classList.add("answered");
                        
                        // Auto-advance to next question if not on last question
                        if (currentQuestion < 10) {
                            setTimeout(function() {
                                showQuestion(currentQuestion + 1);
                            }, 500);
                        }
                        
                        updateNavigation();
                    });
                });
                
                // Initialize navigation
                updateNavigation();
            });
        </script>
    </body>
    </html>
    ''', questions=questions, section_info=section_info)
    
    
@app.route('/results')
def results():
    if 'username' not in session:
        return redirect(url_for('login'))

    # Initialize scores with defaults
    tests = {
        'aptitude': 0,
        'technical': 0,
        'communication': 0,
        'resume': 0
    }
    
    # Get scores from session
    if 'tests' in session:
        tests.update(session['tests'])
    else:
        # Fallback to individual score keys if 'tests' dict is not present
        tests['aptitude'] = session.get('aptitude_score', 0)
        tests['technical'] = session.get('technical_score', 0)
        tests['communication'] = session.get('communication_score', 0)
        tests['resume'] = session.get('resume_score', 0)
    
    # Store in session for other routes
    session['tests'] = tests
    session.modified = True
    
    # Get user data
    user_data = {
        'username': session.get('username'),
        'cgpa': session.get('cgpa', 0),
        'backlogs': session.get('backlogs', 0),
        'hackathons': session.get('hackathons', 0),
        'certificates': session.get('certificates', 0),
        'internship': session.get('internship', 0),
        'Projects': session.get('Projects', 0),
        'Branch': session.get('Branch', '')
    }
    
    # Get detailed answers for each test
    test_details = {
        'aptitude': session.get('aptitude_answers', {}),
        'technical': session.get('technical_answers', {}),
        'communication': session.get('communication_answers', {})
    }

    return render_template('results.html',
        tests=tests,
        test_details=test_details,
        **user_data
    )
    

@app.route('/final_result')
def final_result():
    if 'username' not in session:
        return redirect(url_for('login'))

    from ml_predictor import get_prediction_from_session
    
    # Get prediction first as it's most time-consuming
    prediction = get_prediction_from_session(session)
    
    # Prepare data for scoring
    score_data = {
        'cgpa': session.get('cgpa', 0),
        'backlogs': session.get('backlogs', 0),
        'certifications': session.get('certificates', 0),
        'aptitude_score': session.get('aptitude_score', 0),
        'technical_score': session.get('technical_score', 0),
        'communication_score': session.get('communication_score', 0),
        'resume_score': session.get('resume_score', 0),
    }
    
    # Calculate scores and feedback in parallel
    readiness_score = calculate_readiness_score(score_data)
    feedback = generate_feedback(score_data)
    
    return render_template('final_result.html',
                         username=session['username'],
                         readiness_score=round(readiness_score, 1),
                         feedback=feedback,
                         placement_ready=prediction['placement_ready'],
                         company_fit=prediction['company_fit'])

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# API Health Check
@app.route('/api/health')
def health_check():
    return {"status": "healthy", "message": "CampusFit API is running"}

# Serve React Frontend
@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

# Handle React Router routes (SPA routing)
@app.route('/<path:path>')
def serve_static_files(path):
    # If it's an API route, let Flask handle it normally
    if path.startswith('api/'):
        return {"error": "API endpoint not found"}, 404
    
    # Try to serve static files (CSS, JS, images, etc.)
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # If file not found, serve index.html for React Router
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=settings.DEBUG)
