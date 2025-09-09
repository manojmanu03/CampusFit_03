from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from utils.auth import require_auth
from utils.job_matching import JobDescriptionAnalyzer, JobAwareResumeScorer
from config import settings
from services.mongo_client import get_db
import os
from pdfminer.high_level import extract_text as pdf_extract_text
import docx2txt
from datetime import datetime

resume_bp = Blueprint('resume_bp', __name__, url_prefix='/api/resume')

ALLOWED_EXT = {'pdf', 'doc', 'docx'}

# Database connection
db = get_db()
profiles = db.profiles


def _extract_resume_text(filepath: str) -> str:
    ext = filepath.rsplit('.', 1)[1].lower()
    try:
        if ext == 'pdf':
            return pdf_extract_text(filepath)
        elif ext in ['doc', 'docx']:
            return docx2txt.process(filepath)
        return ''
    except Exception as e:
        print('Resume extract error:', e)
        return ''


def _analyze_resume_quality(text: str, filename: str, job_description: str = None) -> dict:
    # Enhanced validation for resume content
    if not text or not text.strip():
        return {
            'overall_score': 0.0, 'ats_score': 0.0, 'quality_score': 0.0,
            'quality_feedback': ['❌ CRITICAL ERROR: No readable content found in resume'],
            'ats_feedback': ['❌ CRITICAL ERROR: Cannot analyze empty document'],
            'overall_assessment': '🚫 Invalid Resume: Please upload a resume with actual content',
            'recommendations': ['Upload a properly formatted resume with text content', 'Ensure the file is not corrupted or password-protected'],
            'word_count': 0, 'tech_keywords_found': 0
        }
    
    text_lower = text.lower()
    word_count = len(text.split())
    
    # Check for minimum viable content
    if word_count < 50:
        return {
            'overall_score': 0.0, 'ats_score': 0.0, 'quality_score': 0.0,
            'quality_feedback': [f'❌ CRITICAL ERROR: Resume too short ({word_count} words)', '🔧 IMPROVE: A professional resume should have at least 200-300 words'],
            'ats_feedback': ['❌ FAULT: Insufficient content for ATS analysis', '🔧 IMPROVE: Add detailed work experience, skills, and education sections'],
            'overall_assessment': '🚫 Insufficient Content: Resume needs substantial content to be viable',
            'recommendations': ['Add detailed work experience with achievements', 'Include comprehensive skills section', 'Add education and contact information'],
            'word_count': word_count, 'tech_keywords_found': 0
        }
    
    # Check for basic resume sections
    essential_indicators = ['experience', 'work', 'skill', 'education', 'email', '@']
    found_indicators = sum(1 for indicator in essential_indicators if indicator in text_lower)
    
    if found_indicators < 2:
        return {
            'overall_score': 15.0, 'ats_score': 10.0, 'quality_score': 20.0,
            'quality_feedback': ['❌ FAULT: Missing essential resume sections', '🔧 IMPROVE: Add work experience, skills, education, and contact information'],
            'ats_feedback': ['❌ FAULT: No recognizable resume structure', '🔧 IMPROVE: Use standard resume sections with clear headers'],
            'overall_assessment': '⚠️ Poor Structure: Resume lacks basic professional sections',
            'recommendations': ['Use a standard resume template', 'Include contact information, work experience, skills, and education'],
            'word_count': word_count, 'tech_keywords_found': 0
        }
    
    bullet_count = text.count("•") + text.count("- ") + text.count("* ")
    
    # Initialize scoring components
    content_score = 0
    structure_score = 0
    ats_score = 0
    
    feedback = []
    
    # === CONTENT ANALYSIS (40% of total score) ===
    content_feedback = []
    
    # 1. Essential sections presence (0-25 points)
    required_sections = {
        'contact': ['email', '@', 'phone', 'linkedin'],
        'experience': ['experience', 'work', 'employment', 'career'],
        'education': ['education', 'degree', 'university', 'college'],
        'skills': ['skills', 'technologies', 'proficient', 'expertise']
    }
    
    sections_found = 0
    for section_name, keywords in required_sections.items():
        if any(keyword in text_lower for keyword in keywords):
            sections_found += 1
    
    content_score += (sections_found / len(required_sections)) * 25
    
    if sections_found >= 4:
        content_feedback.append("✅ All essential sections present")
    elif sections_found >= 3:
        content_feedback.append("⚠️ Most essential sections present")
    else:
        content_feedback.append("❌ Missing critical sections (contact, experience, education, skills)")
    
    # 2. Professional experience depth (0-20 points)
    action_verbs = ['developed', 'implemented', 'designed', 'created', 'managed', 'led', 'optimized', 
                   'automated', 'deployed', 'architected', 'built', 'established', 'improved', 
                   'delivered', 'collaborated', 'analyzed', 'coordinated']
    
    action_count = sum(1 for verb in action_verbs if verb in text_lower)
    experience_score = min(20, action_count * 2.5)
    content_score += experience_score
    
    if action_count >= 5:
        content_feedback.append("✅ Strong use of action verbs")
    elif action_count >= 2:
        content_feedback.append("✅ Good action verbs, could add more variety")
    else:
        content_feedback.append("⚠️ Use more strong action verbs to describe achievements")
    
    # 3. Quantifiable achievements (0-15 points)
    numbers = len([word for word in text.split() if any(char.isdigit() for char in word)])
    percentage_indicators = text_lower.count('%') + text_lower.count('percent')
    metrics_score = min(15, (numbers * 2) + (percentage_indicators * 3))
    content_score += metrics_score
    
    if numbers >= 6:
        content_feedback.append("✅ Good use of quantifiable metrics")
    elif numbers >= 3:
        content_feedback.append("✅ Some metrics present, add more specific numbers")
    else:
        content_feedback.append("⚠️ Add quantifiable achievements (percentages, numbers, metrics)")
    
    # === STRUCTURE & FORMATTING (30% of total score) ===
    structure_feedback = []
    
    # 1. Length appropriateness (0-15 points)
    if 350 <= word_count <= 800:
        structure_score += 15
        structure_feedback.append("✅ Optimal resume length")
    elif 250 <= word_count <= 1000:
        structure_score += 12
        structure_feedback.append("✅ Good length, minor optimization possible")
    elif 150 <= word_count <= 1300:
        structure_score += 10
        structure_feedback.append("✅ Acceptable length but could be improved")
    else:
        structure_score += 5
        structure_feedback.append("⚠️ Resume length needs adjustment (aim for 350-800 words)")
    
    # 2. Formatting and readability (0-10 points)
    if bullet_count >= 6:
        structure_score += 10
        structure_feedback.append("✅ Excellent use of bullet points")
    elif bullet_count >= 3:
        structure_score += 8
        structure_feedback.append("✅ Good formatting, could use more bullet points")
    elif bullet_count >= 1:
        structure_score += 6
        structure_feedback.append("✅ Some bullet points present, add more for clarity")
    else:
        structure_score += 2
        structure_feedback.append("⚠️ Use bullet points for better readability")
    
    # 3. Professional language (0-5 points)
    professional_terms = ['leadership', 'collaboration', 'problem-solving', 'communication', 
                         'teamwork', 'innovation', 'strategic', 'analytical', 'detail-oriented']
    prof_count = sum(1 for term in professional_terms if term in text_lower)
    structure_score += min(5, prof_count * 1.5)
    
    if prof_count >= 3:
        structure_feedback.append("✅ Strong professional language")
    elif prof_count >= 1:
        structure_feedback.append("✅ Some professional terms, could add more")
    else:
        structure_feedback.append("⚠️ Add more professional soft skills")
    
    # === ATS COMPATIBILITY (30% of total score) ===
    ats_feedback = []
    
    # Check if we have job description for intelligent matching
    if job_description and job_description.strip():
        # Use job-aware scoring
        jd_analyzer = JobDescriptionAnalyzer()
        job_scorer = JobAwareResumeScorer()
        
        job_requirements = jd_analyzer.extract_job_requirements(job_description)
        job_match_result = job_scorer.calculate_job_match_score(text, job_requirements)
        
        ats_score = (job_match_result['ats_score'] / 100) * 30
        
        # Add job-specific feedback
        ats_feedback.append(f"🎯 Job Match Score: {job_match_result['ats_score']:.1f}%")
        ats_feedback.append(f"📊 Role Category: {job_requirements['role_category'].replace('_', ' ').title()}")
        
        if job_match_result['keyword_match'] >= 80:
            ats_feedback.append("✅ Excellent keyword alignment with job requirements")
        elif job_match_result['keyword_match'] >= 60:
            ats_feedback.append("✅ Good keyword match, minor improvements possible")
        else:
            ats_feedback.append("⚠️ Low keyword match - add more job-specific terms")
        
        if job_match_result['skills_coverage'] >= 70:
            ats_feedback.append("✅ Strong technical skills coverage for this role")
        else:
            ats_feedback.append("⚠️ Technical skills need strengthening for this role")
        
        # Add detailed job-specific feedback with improvement areas
        ats_feedback.extend(job_match_result['detailed_feedback'])
        
        # Add improvement priority areas
        if job_match_result.get('improvement_areas'):
            ats_feedback.append("")
            ats_feedback.append("🎯 PRIORITY IMPROVEMENT AREAS:")
            for area in job_match_result['improvement_areas']:
                ats_feedback.append(f"• {area}")
        
    else:
        # Fallback to general ATS scoring
        # 1. File format (0-5 points)
        ext = filename.rsplit('.', 1)[1].lower()
        if ext == 'pdf':
            ats_score += 5
            ats_feedback.append("✅ PDF format is ATS-friendly")
        elif ext in ['doc', 'docx']:
            ats_score += 4
            ats_feedback.append("⚠️ Word format acceptable, PDF preferred")
        
        # 2. General technical keywords (0-15 points)
        tech_keywords = {
            'python': 1, 'javascript': 1, 'java': 1, 'c++': 1, 'sql': 1,
            'react': 1, 'angular': 1, 'vue': 1, 'html': 0.5, 'css': 0.5,
            'aws': 1.5, 'azure': 1.5, 'gcp': 1.5, 'docker': 1, 'kubernetes': 1,
            'machine learning': 1.5, 'data science': 1.5, 'ai': 1, 'analytics': 1,
            'mongodb': 1, 'postgresql': 1, 'mysql': 1, 'redis': 1,
            'agile': 0.5, 'scrum': 0.5, 'api': 0.5, 'rest': 0.5
        }
        
        tech_score = min(15, sum(weight for term, weight in tech_keywords.items() if term in text_lower))
        ats_score += tech_score
        
        if tech_score >= 6:
            ats_feedback.append("✅ Good general technical keywords")
        else:
            ats_feedback.append("⚠️ Add more technical keywords")
        
        # 3. Standard formatting (0-10 points)
        standard_headers = ['summary', 'objective', 'experience', 'education', 'skills', 'projects']
        header_count = sum(1 for header in standard_headers if header in text_lower)
        ats_score += min(10, header_count * 2.5)
        
        if header_count >= 3:
            ats_feedback.append("✅ Good section organization")
        else:
            ats_feedback.append("⚠️ Use clear section headers")
        
        ats_feedback.append("💡 Upload with job description for personalized ATS analysis")
    
    # === CALCULATE FINAL SCORES ===
    # Convert to 0-100 scale and apply realistic curve
    content_percentage = min(100, (content_score / 60) * 100)  # Max 60 points
    structure_percentage = min(100, (structure_score / 30) * 100)  # Max 30 points  
    ats_percentage = min(100, (ats_score / 30) * 100)  # Max 30 points
    
    # Apply realistic scoring curve (most resumes should score 65-90)
    def apply_curve(score):
        if score >= 85:
            return min(92, score * 0.92 + 8)  # Cap excellent scores at 92
        elif score >= 60:
            return score * 0.95 + 5  # Good scores: 65-85 range
        else:
            return score * 0.85 + 15  # Poor scores get boost: 55-75 range
    
    final_content = apply_curve(content_percentage)
    final_structure = apply_curve(structure_percentage) 
    final_ats = apply_curve(ats_percentage)
    
    # Weighted overall score
    overall_score = round((final_content * 0.4 + final_structure * 0.3 + final_ats * 0.3), 1)
    
    # Enhanced feedback with fault identification and improvement areas
    quality_feedback = []
    quality_feedback.append("=== CONTENT ANALYSIS ===")
    
    # Add specific fault identification for content
    content_faults = []
    content_improvements = []
    for item in content_feedback:
        if item.startswith('❌') or 'Missing' in item or 'critical' in item.lower():
            content_faults.append(item)
        elif item.startswith('⚠️') or 'could' in item.lower() or 'add more' in item.lower():
            content_improvements.append(f"🔧 IMPROVE: {item.replace('⚠️', '').strip()}")
        else:
            quality_feedback.append(item)
    
    quality_feedback.extend(content_faults)
    quality_feedback.extend(content_improvements)
    quality_feedback.append("=== STRUCTURE & FORMATTING ===")
    
    # Add specific fault identification for structure
    structure_faults = []
    structure_improvements = []
    for item in structure_feedback:
        if 'needs adjustment' in item.lower() or 'missing' in item.lower():
            structure_faults.append(f"❌ FAULT: {item.replace('⚠️', '').strip()}")
        elif item.startswith('⚠️') or 'could' in item.lower():
            structure_improvements.append(f"🔧 IMPROVE: {item.replace('⚠️', '').strip()}")
        else:
            quality_feedback.append(item)
    
    quality_feedback.extend(structure_faults)
    quality_feedback.extend(structure_improvements)
    
    ats_feedback_final = []
    ats_feedback_final.append("=== ATS COMPATIBILITY ===")
    ats_feedback_final.extend(ats_feedback)
    
    # Overall assessment
    overall_assessment = ""
    if overall_score >= 85:
        overall_assessment = "🎉 Outstanding resume! Highly competitive for top positions"
    elif overall_score >= 75:
        overall_assessment = "👍 Strong resume with excellent potential"
    elif overall_score >= 65:
        overall_assessment = "⚠️ Good foundation, some improvements will make it stronger"
    else:
        overall_assessment = "📝 Significant improvements needed for better competitiveness"
    
    # Set tech_score for return value
    if job_description and job_description.strip():
        # For job-aware scoring, use the ATS score as tech score indicator
        tech_score_for_return = ats_score / 30 * 15  # Convert back to original scale
    else:
        tech_score_for_return = tech_score if 'tech_score' in locals() else 0
    
    return {
        'overall_score': overall_score,
        'ats_score': final_ats,
        'quality_score': (final_content + final_structure) / 2,
        'content_score': final_content,
        'structure_score': final_structure,
        'quality_feedback': quality_feedback,
        'ats_feedback': ats_feedback_final,
        'overall_assessment': overall_assessment,
        'word_count': word_count,
        'tech_keywords_found': tech_score_for_return,
        'recommendations': _get_modern_recommendations(overall_score, final_ats, (final_content + final_structure) / 2)
    }


def _get_modern_recommendations(overall_score: float, ats_score: float, quality_score: float) -> list:
    recommendations = []
    
    if ats_score < 6:
        recommendations.extend([
            "Add current technology stack: Python, React, Node.js, AWS",
            "Include cloud platforms: AWS, Azure, or Google Cloud",
            "Mention modern frameworks and tools you've used",
            "Use ATS-friendly formatting with clear section headers"
        ])
    
    if quality_score < 6:
        recommendations.extend([
            "Quantify achievements with specific numbers and percentages",
            "Use strong action verbs: developed, implemented, optimized",
            "Keep resume length between 300-800 words",
            "Add more bullet points for better readability"
        ])
    
    if overall_score < 7:
        recommendations.extend([
            "Include links to GitHub, LinkedIn, and portfolio",
            "Add relevant certifications (AWS, Google, Microsoft)",
            "Mention agile/scrum methodologies if applicable",
            "Highlight any open-source contributions or personal projects"
        ])
    
    # Always include trending recommendations
    recommendations.extend([
        "Consider adding: AI/ML experience, microservices, containerization",
        "Highlight remote work and collaboration tools experience",
        "Include any experience with modern development practices (CI/CD, DevOps)"
    ])
    
    return recommendations


@resume_bp.route('/upload', methods=['POST', 'OPTIONS'])
@require_auth
def upload():
    # Handle preflight
    if request.method == 'OPTIONS':
        return ('', 204)
    if 'resume' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['resume']
    if not f.filename:
        return jsonify({'error': 'Empty filename'}), 400
    ext = f.filename.rsplit('.', 1)[-1].lower()
    if ext not in ALLOWED_EXT:
        return jsonify({'error': 'Invalid extension'}), 400

    # Get job description from form data
    job_description = request.form.get('job_description', '').strip()
    
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    filename = secure_filename(f.filename)
    path = os.path.join(settings.UPLOAD_FOLDER, filename)
    f.save(path)

    text = _extract_resume_text(path)
    
    # Always analyze, let the function handle validation
    analysis = _analyze_resume_quality(text, filename, job_description)

    try:
        os.remove(path)
    except Exception:
        pass

    # Store resume score in user profile
    user_id = g.user.get('sub')
    resume_update = {
        'resume_score': analysis['overall_score'],
        'resume_quality_score': analysis['quality_score'],
        'resume_ats_score': analysis['ats_score'],
        'resume_updated_at': datetime.utcnow()
    }
    profiles.update_one(
        {'user_id': user_id}, 
        {'$set': resume_update}, 
        upsert=True
    )

    return jsonify({
        'score': analysis['overall_score'],
        'resume_score': analysis['overall_score'],
        'ats_score': analysis['ats_score'],
        'quality_score': analysis['quality_score'],
        'quality_feedback': analysis['quality_feedback'],
        'ats_feedback': analysis['ats_feedback'],
        'overall_assessment': analysis['overall_assessment'],
        'recommendations': analysis['recommendations'],
        'word_count': analysis.get('word_count', 0),
        'tech_keywords_found': analysis.get('tech_keywords_found', 0),
        'job_aware': bool(job_description),
        'resume_text': text[:500] + '...' if len(text) > 500 else text  # First 500 chars for display
    })
