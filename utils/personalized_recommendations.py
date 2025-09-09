"""
Personalized recommendation engine based on user profile and test performance
"""

def generate_personalized_recommendations(user_data):
    """
    Generate personalized recommendations based on user's profile and test scores
    
    Args:
        user_data: Dictionary containing user profile and test results
        
    Returns:
        Dictionary with personalized strengths, improvements, and action items
    """
    
    # Extract user data
    cgpa = user_data.get('cgpa', 0)
    branch = user_data.get('branch', 'CSE')
    backlogs = user_data.get('backlogs', 0)
    certifications = user_data.get('certifications', 0)
    internship = user_data.get('internship', 0)
    projects = user_data.get('projects', 0)
    hackathon = user_data.get('hackathon', 0)
    aptitude_score = user_data.get('aptitude', 0)
    technical_score = user_data.get('technical', 0)
    communication_score = user_data.get('communication', 0)
    resume_score = user_data.get('resume', 0)
    
    strengths = []
    improvements = []
    action_items = []
    
    # CGPA-based recommendations
    if cgpa >= 8.5:
        strengths.append("Excellent academic performance (CGPA: {:.1f})".format(cgpa))
        action_items.append("Target Tier 1 companies like Google, Microsoft, Amazon")
    elif cgpa >= 7.5:
        strengths.append("Strong academic foundation (CGPA: {:.1f})".format(cgpa))
        action_items.append("Apply to Tier 1 and Tier 2 companies")
    elif cgpa >= 6.5:
        strengths.append("Good academic performance (CGPA: {:.1f})".format(cgpa))
        action_items.append("Focus on Tier 2 and Tier 3 companies initially")
    else:
        improvements.append("Improve academic performance (Current CGPA: {:.1f})".format(cgpa))
        action_items.append("Focus on skill development to compensate for lower CGPA")
    
    # Backlogs analysis
    if backlogs == 0:
        strengths.append("Clean academic record with no backlogs")
    elif backlogs <= 2:
        improvements.append("Clear remaining {} backlog(s) before placements".format(backlogs))
    else:
        improvements.append("Priority: Clear {} backlogs immediately".format(backlogs))
        action_items.append("Dedicate time to clear backlogs - major placement criteria")
    
    # Branch-specific recommendations
    branch_advice = {
        'CSE': {
            'focus': 'Software Development, Data Science, AI/ML',
            'skills': 'DSA, System Design, Full-Stack Development',
            'companies': 'Tech giants, Startups, Product companies'
        },
        'AI&DS': {
            'focus': 'Machine Learning, Data Analytics, AI Research',
            'skills': 'Python, TensorFlow, Statistics, SQL',
            'companies': 'AI companies, Research labs, Tech consultancies'
        },
        'ECE': {
            'focus': 'Embedded Systems, IoT, Telecommunications',
            'skills': 'C/C++, Hardware design, Signal processing',
            'companies': 'Hardware companies, Telecom, Automotive'
        },
        'MECH': {
            'focus': 'Design, Manufacturing, Automotive',
            'skills': 'CAD, Manufacturing processes, Project management',
            'companies': 'Manufacturing, Automotive, Aerospace'
        },
        'CIVIL': {
            'focus': 'Construction, Infrastructure, Project management',
            'skills': 'AutoCAD, Project planning, Site management',
            'companies': 'Construction firms, Infrastructure companies'
        },
        'ISE': {
            'focus': 'Information Systems, Business Analysis',
            'skills': 'Database management, Business processes, Analytics',
            'companies': 'IT services, Consulting, Business analytics'
        }
    }
    
    if branch in branch_advice:
        advice = branch_advice[branch]
        action_items.append("Focus on {} roles in {}".format(advice['focus'], branch))
        action_items.append("Develop skills: {}".format(advice['skills']))
        action_items.append("Target companies: {}".format(advice['companies']))
    
    # Test scores analysis
    if aptitude_score >= 8:
        strengths.append("Excellent logical reasoning (Aptitude: {}/10)".format(aptitude_score))
    elif aptitude_score >= 6:
        strengths.append("Good problem-solving skills (Aptitude: {}/10)".format(aptitude_score))
    else:
        improvements.append("Strengthen logical reasoning (Current: {}/10)".format(aptitude_score))
        action_items.append("Practice aptitude questions daily - use apps like IndiaBix, PrepInsta")
    
    if technical_score >= 8:
        strengths.append("Strong technical knowledge ({}/10)".format(technical_score))
    elif technical_score >= 6:
        strengths.append("Decent technical foundation ({}/10)".format(technical_score))
    else:
        improvements.append("Improve technical skills (Current: {}/10)".format(technical_score))
        if branch in ['CSE', 'AI&DS', 'ISE']:
            action_items.append("Focus on DSA, practice coding on LeetCode/HackerRank")
        else:
            action_items.append("Strengthen core {} concepts and practical applications".format(branch))
    
    if communication_score >= 8:
        strengths.append("Excellent communication skills ({}/10)".format(communication_score))
    elif communication_score >= 6:
        strengths.append("Good communication abilities ({}/10)".format(communication_score))
    else:
        improvements.append("Enhance communication skills (Current: {}/10)".format(communication_score))
        action_items.append("Practice speaking, join Toastmasters, do mock interviews")
    
    # Experience and projects
    if internship >= 2:
        strengths.append("Good industry exposure ({} internships)".format(internship))
    elif internship >= 1:
        strengths.append("Some industry experience ({} internship)".format(internship))
    else:
        improvements.append("Gain practical industry experience")
        action_items.append("Apply for internships on LinkedIn, Internshala, company websites")
    
    if projects >= 3:
        strengths.append("Strong project portfolio ({} projects)".format(projects))
    elif projects >= 1:
        strengths.append("Decent project experience ({} projects)".format(projects))
    else:
        improvements.append("Build more practical projects")
        action_items.append("Create 2-3 projects showcasing your {} skills".format(branch))
    
    # Certifications
    if certifications >= 3:
        strengths.append("Well-certified professional ({} certifications)".format(certifications))
    elif certifications >= 1:
        strengths.append("Some relevant certifications ({})".format(certifications))
    else:
        improvements.append("Obtain industry-relevant certifications")
        if branch in ['CSE', 'AI&DS']:
            action_items.append("Get AWS/Azure, Google Cloud, or programming certifications")
        else:
            action_items.append("Pursue {} domain-specific certifications".format(branch))
    
    # Hackathons and competitions
    if hackathon >= 1:
        strengths.append("Competitive programming/hackathon experience")
    else:
        action_items.append("Participate in hackathons and coding competitions")
    
    # Resume analysis
    if resume_score >= 8:
        strengths.append("Well-crafted resume (Score: {}/10)".format(resume_score))
    elif resume_score >= 6:
        strengths.append("Decent resume quality (Score: {}/10)".format(resume_score))
    else:
        improvements.append("Improve resume quality (Current: {}/10)".format(resume_score))
        action_items.append("Use action verbs, quantify achievements, get resume reviewed")
    
    # Overall performance recommendations
    total_test_score = aptitude_score + technical_score + communication_score
    if total_test_score >= 24:
        action_items.append("You're well-prepared! Focus on interview preparation and company research")
    elif total_test_score >= 18:
        action_items.append("Good foundation. Polish weak areas and practice mock interviews")
    else:
        action_items.append("Intensive preparation needed. Create a 3-month improvement plan")
    
    # Specific company recommendations based on profile
    company_recommendations = []
    if cgpa >= 8.0 and technical_score >= 7 and backlogs == 0:
        company_recommendations = ["Google", "Microsoft", "Amazon", "Adobe", "Salesforce"]
    elif cgpa >= 7.0 and technical_score >= 6:
        company_recommendations = ["Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Capgemini"]
    else:
        company_recommendations = ["Local companies", "Startups", "Service-based companies"]
    
    return {
        'strengths': strengths,
        'improvements': improvements,
        'action_items': action_items,
        'company_recommendations': company_recommendations,
        'focus_areas': {
            'technical': technical_score < 7,
            'communication': communication_score < 7,
            'experience': internship == 0,
            'projects': projects < 2,
            'certifications': certifications == 0
        }
    }
