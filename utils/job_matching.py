"""
Advanced job description matching and role-specific ATS scoring utilities.
This module provides intelligent resume analysis based on specific job requirements.
"""

import re
from typing import Dict, List, Tuple, Set
from collections import Counter
import math

class JobDescriptionAnalyzer:
    """Analyzes job descriptions to extract key requirements and skills."""
    
    def __init__(self):
        self.role_categories = {
            'software_engineer': ['software engineer', 'developer', 'programmer', 'sde', 'software development'],
            'data_scientist': ['data scientist', 'data analyst', 'ml engineer', 'machine learning', 'ai engineer'],
            'devops': ['devops', 'site reliability', 'platform engineer', 'infrastructure', 'cloud engineer'],
            'frontend': ['frontend', 'front-end', 'ui developer', 'react developer', 'angular developer'],
            'backend': ['backend', 'back-end', 'api developer', 'server developer', 'microservices'],
            'fullstack': ['fullstack', 'full-stack', 'full stack developer'],
            'mobile': ['mobile developer', 'ios developer', 'android developer', 'react native', 'flutter'],
            'qa': ['qa engineer', 'test engineer', 'automation tester', 'quality assurance'],
            'product_manager': ['product manager', 'product owner', 'pm', 'product lead'],
            'cybersecurity': ['security engineer', 'cybersecurity', 'infosec', 'security analyst']
        }
        
        self.skill_categories = {
            'programming_languages': {
                'python': ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
                'javascript': ['javascript', 'js', 'node.js', 'nodejs', 'typescript', 'ts'],
                'java': ['java', 'spring', 'spring boot', 'hibernate', 'maven', 'gradle'],
                'csharp': ['c#', 'csharp', '.net', 'dotnet', 'asp.net', 'entity framework'],
                'cpp': ['c++', 'cpp', 'c plus plus'],
                'go': ['golang', 'go lang', 'go programming'],
                'rust': ['rust', 'rust lang'],
                'php': ['php', 'laravel', 'symfony', 'codeigniter'],
                'ruby': ['ruby', 'rails', 'ruby on rails'],
                'swift': ['swift', 'ios', 'xcode'],
                'kotlin': ['kotlin', 'android'],
                'scala': ['scala', 'akka', 'play framework'],
                'r': ['r programming', 'r language', 'rstudio']
            },
            'frameworks': {
                'react': ['react', 'reactjs', 'react.js', 'redux', 'next.js', 'nextjs'],
                'angular': ['angular', 'angularjs', 'rxjs', 'ngrx'],
                'vue': ['vue', 'vuejs', 'vue.js', 'nuxt', 'vuex'],
                'django': ['django', 'django rest framework', 'drf'],
                'flask': ['flask', 'flask-restful'],
                'express': ['express', 'expressjs', 'express.js'],
                'spring': ['spring boot', 'spring framework', 'spring mvc'],
                'laravel': ['laravel', 'eloquent'],
                'rails': ['ruby on rails', 'rails']
            },
            'databases': {
                'sql': ['mysql', 'postgresql', 'postgres', 'sql server', 'oracle', 'sqlite'],
                'nosql': ['mongodb', 'cassandra', 'dynamodb', 'couchdb', 'neo4j'],
                'cache': ['redis', 'memcached', 'elasticsearch']
            },
            'cloud_platforms': {
                'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds', 'cloudformation'],
                'azure': ['azure', 'microsoft azure', 'azure functions', 'cosmos db'],
                'gcp': ['google cloud', 'gcp', 'google cloud platform', 'firebase', 'bigquery'],
                'other_cloud': ['heroku', 'digitalocean', 'linode', 'vultr']
            },
            'devops_tools': {
                'containers': ['docker', 'kubernetes', 'k8s', 'containerd', 'podman'],
                'cicd': ['jenkins', 'gitlab ci', 'github actions', 'circleci', 'travis ci'],
                'monitoring': ['prometheus', 'grafana', 'elk stack', 'datadog', 'new relic'],
                'iac': ['terraform', 'ansible', 'chef', 'puppet', 'cloudformation']
            },
            'data_science': {
                'ml_frameworks': ['tensorflow', 'pytorch', 'scikit-learn', 'keras', 'xgboost'],
                'data_tools': ['pandas', 'numpy', 'matplotlib', 'seaborn', 'jupyter'],
                'big_data': ['spark', 'hadoop', 'kafka', 'airflow', 'dask'],
                'visualization': ['tableau', 'power bi', 'plotly', 'd3.js']
            }
        }
    
    def extract_job_requirements(self, job_description: str) -> Dict:
        """Extract structured requirements from job description."""
        jd_lower = job_description.lower()
        
        # Detect role category
        role_category = self._detect_role_category(jd_lower)
        
        # Extract required skills
        required_skills = self._extract_skills(jd_lower)
        
        # Extract experience level
        experience_level = self._extract_experience_level(jd_lower)
        
        # Extract education requirements
        education_req = self._extract_education_requirements(jd_lower)
        
        # Extract soft skills
        soft_skills = self._extract_soft_skills(jd_lower)
        
        # Extract company size/type indicators
        company_context = self._extract_company_context(jd_lower)
        
        return {
            'role_category': role_category,
            'required_skills': required_skills,
            'experience_level': experience_level,
            'education_requirements': education_req,
            'soft_skills': soft_skills,
            'company_context': company_context,
            'priority_keywords': self._extract_priority_keywords(jd_lower, role_category)
        }
    
    def _detect_role_category(self, jd_lower: str) -> str:
        """Detect the primary role category from job description."""
        role_scores = {}
        
        for category, keywords in self.role_categories.items():
            score = sum(1 for keyword in keywords if keyword in jd_lower)
            if score > 0:
                role_scores[category] = score
        
        if not role_scores:
            return 'general'
        
        return max(role_scores.keys(), key=role_scores.get)
    
    def _extract_skills(self, jd_lower: str) -> Dict[str, List[str]]:
        """Extract technical skills by category."""
        found_skills = {}
        
        for category, subcategories in self.skill_categories.items():
            found_skills[category] = {}
            for subcat, skills in subcategories.items():
                found_skills[category][subcat] = [
                    skill for skill in skills if skill in jd_lower
                ]
        
        return found_skills
    
    def _extract_experience_level(self, jd_lower: str) -> Dict:
        """Extract experience requirements."""
        experience_patterns = {
            'entry': r'(entry.level|junior|0.2 years?|fresh|graduate|new grad)',
            'mid': r'(2.5 years?|3.7 years?|mid.level|intermediate)',
            'senior': r'(5.10 years?|senior|lead|principal|8\+ years?)',
            'expert': r'(10\+ years?|expert|architect|15\+ years?)'
        }
        
        levels = {}
        for level, pattern in experience_patterns.items():
            if re.search(pattern, jd_lower):
                levels[level] = True
        
        # Extract specific year requirements
        year_matches = re.findall(r'(\d+)[\+\-\s]*years?', jd_lower)
        years_required = [int(year) for year in year_matches if int(year) <= 20]
        
        return {
            'levels': levels,
            'years_mentioned': years_required,
            'avg_years': sum(years_required) / len(years_required) if years_required else 0
        }
    
    def _extract_education_requirements(self, jd_lower: str) -> Dict:
        """Extract education requirements."""
        education_keywords = {
            'degree_required': ['bachelor', 'master', 'phd', 'degree required', 'bs', 'ms', 'mba'],
            'preferred_fields': ['computer science', 'engineering', 'mathematics', 'statistics'],
            'certifications': ['aws certified', 'google cloud', 'microsoft certified', 'cissp', 'pmp']
        }
        
        found_edu = {}
        for category, keywords in education_keywords.items():
            found_edu[category] = [kw for kw in keywords if kw in jd_lower]
        
        return found_edu
    
    def _extract_soft_skills(self, jd_lower: str) -> List[str]:
        """Extract soft skills mentioned."""
        soft_skills = [
            'leadership', 'communication', 'teamwork', 'problem solving',
            'analytical', 'creative', 'adaptable', 'collaborative',
            'detail oriented', 'time management', 'critical thinking'
        ]
        
        return [skill for skill in soft_skills if skill in jd_lower]
    
    def _extract_company_context(self, jd_lower: str) -> Dict:
        """Extract company context indicators."""
        contexts = {
            'startup': ['startup', 'fast-paced', 'agile environment', 'wear many hats'],
            'enterprise': ['enterprise', 'large scale', 'fortune 500', 'established company'],
            'remote_friendly': ['remote', 'work from home', 'distributed team', 'flexible'],
            'tech_focus': ['cutting edge', 'innovative', 'latest technologies', 'research']
        }
        
        found_contexts = {}
        for context, indicators in contexts.items():
            found_contexts[context] = any(indicator in jd_lower for indicator in indicators)
        
        return found_contexts
    
    def _extract_priority_keywords(self, jd_lower: str, role_category: str) -> List[str]:
        """Extract high-priority keywords based on frequency and role."""
        # Common technical terms that appear frequently
        all_words = re.findall(r'\b[a-z]{3,}\b', jd_lower)
        word_freq = Counter(all_words)
        
        # Filter for technical terms and role-specific keywords
        tech_terms = []
        for category_skills in self.skill_categories.values():
            for skills in category_skills.values():
                tech_terms.extend(skills)
        
        priority_words = []
        for word, freq in word_freq.most_common(20):
            if freq >= 2 and (word in tech_terms or len(word) >= 4):
                priority_words.append(word)
        
        return priority_words[:10]  # Top 10 priority keywords


class JobAwareResumeScorer:
    """Enhanced resume scorer that considers job description requirements."""
    
    def __init__(self):
        self.jd_analyzer = JobDescriptionAnalyzer()
    
    def calculate_job_match_score(self, resume_text: str, job_requirements: Dict) -> Dict:
        """Calculate how well resume matches specific job requirements."""
        resume_lower = resume_text.lower()
        
        # 1. Role-specific keyword matching (40% of ATS score)
        keyword_score = self._calculate_keyword_match(resume_lower, job_requirements)
        
        # 2. Experience level alignment (25% of ATS score)
        experience_score = self._calculate_experience_alignment(resume_lower, job_requirements)
        
        # 3. Technical skills coverage (25% of ATS score)
        skills_score = self._calculate_skills_coverage(resume_lower, job_requirements)
        
        # 4. Soft skills and culture fit (10% of ATS score)
        culture_score = self._calculate_culture_fit(resume_lower, job_requirements)
        
        # Calculate weighted ATS score
        ats_score = (
            keyword_score * 0.40 +
            experience_score * 0.25 +
            skills_score * 0.25 +
            culture_score * 0.10
        )
        
        # Generate improvement recommendations
        improvement_areas = []
        if keyword_score < 75:
            improvement_areas.append("Keyword Optimization")
        if experience_score < 75:
            improvement_areas.append("Experience Presentation")
        if skills_score < 75:
            improvement_areas.append("Technical Skills")
        if culture_score < 75:
            improvement_areas.append("Soft Skills & Culture Fit")
        
        return {
            'ats_score': min(100, ats_score),
            'keyword_match': keyword_score,
            'experience_alignment': experience_score,
            'skills_coverage': skills_score,
            'culture_fit': culture_score,
            'improvement_areas': improvement_areas,
            'detailed_feedback': self._generate_detailed_feedback(
                resume_lower, job_requirements, keyword_score, experience_score, skills_score, culture_score
            )
        }
    
    def _calculate_keyword_match(self, resume_lower: str, job_req: Dict) -> float:
        """Calculate how well resume matches priority keywords."""
        priority_keywords = job_req.get('priority_keywords', [])
        if not priority_keywords:
            return 70  # Default score if no specific keywords
        
        matches = sum(1 for keyword in priority_keywords if keyword in resume_lower)
        match_ratio = matches / len(priority_keywords)
        
        # Apply scoring curve
        if match_ratio >= 0.8:
            return 95
        elif match_ratio >= 0.6:
            return 85
        elif match_ratio >= 0.4:
            return 75
        elif match_ratio >= 0.2:
            return 65
        else:
            return 50
    
    def _calculate_experience_alignment(self, resume_lower: str, job_req: Dict) -> float:
        """Calculate experience level alignment."""
        exp_req = job_req.get('experience_level', {})
        avg_years_req = exp_req.get('avg_years', 0)
        
        # Extract years from resume
        resume_years = re.findall(r'(\d+)[\+\s]*years?', resume_lower)
        resume_years = [int(year) for year in resume_years if int(year) <= 20]
        
        if not resume_years and avg_years_req == 0:
            return 80  # Both unclear, give benefit of doubt
        
        if not resume_years:
            return 60  # Resume doesn't mention experience clearly
        
        max_resume_years = max(resume_years)
        
        # Score based on alignment
        if avg_years_req == 0:
            return 75  # Job doesn't specify, resume has some experience
        
        diff = abs(max_resume_years - avg_years_req)
        if diff <= 1:
            return 95
        elif diff <= 2:
            return 85
        elif diff <= 3:
            return 75
        else:
            return max(50, 75 - (diff * 5))
    
    def _calculate_skills_coverage(self, resume_lower: str, job_req: Dict) -> float:
        """Calculate technical skills coverage."""
        required_skills = job_req.get('required_skills', {})
        role_category = job_req.get('role_category', 'general')
        
        total_score = 0
        category_count = 0
        
        for category, subcategories in required_skills.items():
            if not subcategories:
                continue
                
            category_score = 0
            subcat_count = 0
            
            for subcat, skills in subcategories.items():
                if not skills:
                    continue
                    
                matches = sum(1 for skill in skills if skill in resume_lower)
                subcat_score = (matches / len(skills)) * 100
                category_score += subcat_score
                subcat_count += 1
            
            if subcat_count > 0:
                total_score += category_score / subcat_count
                category_count += 1
        
        if category_count == 0:
            return 70  # Default if no specific skills found
        
        return min(100, total_score / category_count)
    
    def _calculate_culture_fit(self, resume_lower: str, job_req: Dict) -> float:
        """Calculate culture and soft skills fit."""
        soft_skills = job_req.get('soft_skills', [])
        company_context = job_req.get('company_context', {})
        
        score = 70  # Base score
        
        # Soft skills matching
        if soft_skills:
            matches = sum(1 for skill in soft_skills if skill in resume_lower)
            skill_bonus = (matches / len(soft_skills)) * 20
            score += skill_bonus
        
        # Company context alignment
        context_indicators = {
            'startup': ['agile', 'fast-paced', 'startup', 'mvp', 'rapid'],
            'enterprise': ['enterprise', 'scale', 'large team', 'process'],
            'remote_friendly': ['remote', 'distributed', 'collaboration'],
            'tech_focus': ['innovation', 'research', 'cutting edge', 'latest']
        }
        
        for context, is_relevant in company_context.items():
            if is_relevant and context in context_indicators:
                indicators = context_indicators[context]
                if any(indicator in resume_lower for indicator in indicators):
                    score += 5
        
        return min(100, score)
    
    def _generate_detailed_feedback(self, resume_lower: str, job_req: Dict, 
                                  keyword_score: float, exp_score: float, 
                                  skills_score: float, culture_score: float) -> List[str]:
        """Generate detailed, actionable feedback with specific faults and improvements."""
        feedback = []
        
        # Detailed keyword analysis
        priority_keywords = job_req.get('priority_keywords', [])
        missing_keywords = [kw for kw in priority_keywords if kw not in resume_lower]
        present_keywords = [kw for kw in priority_keywords if kw in resume_lower]
        
        if keyword_score < 80:
            if missing_keywords:
                feedback.append(f"❌ FAULT: Missing {len(missing_keywords)} critical job keywords")
                feedback.append(f"🔧 IMPROVE: Add these exact terms from job posting: {', '.join(missing_keywords[:5])}")
            if len(present_keywords) > 0:
                feedback.append(f"✅ STRENGTH: Found {len(present_keywords)} relevant keywords: {', '.join(present_keywords[:3])}")
        else:
            feedback.append(f"✅ EXCELLENT: Strong keyword alignment ({len(present_keywords)}/{len(priority_keywords)} matched)")
        
        # Detailed experience analysis
        exp_req = job_req.get('experience_level', {})
        avg_years_req = exp_req.get('avg_years', 0)
        
        if exp_score < 75 and avg_years_req > 0:
            feedback.append(f"❌ FAULT: Experience level unclear or misaligned with {avg_years_req}+ years requirement")
            feedback.append(f"🔧 IMPROVE: Prominently display '{avg_years_req}+ years experience' in summary section")
            feedback.append(f"🔧 IMPROVE: Quantify achievements with years/duration (e.g., 'Led team for 3 years')")
        
        # Detailed skills gap analysis
        required_skills = job_req.get('required_skills', {})
        role_category = job_req.get('role_category', 'general')
        
        if skills_score < 70:
            missing_skill_categories = []
            for category, subcategories in required_skills.items():
                for subcat, skills in subcategories.items():
                    if skills and not any(skill in resume_lower for skill in skills):
                        missing_skill_categories.append(f"{category.replace('_', ' ').title()}")
            
            if missing_skill_categories:
                feedback.append(f"❌ FAULT: Missing key {role_category.replace('_', ' ')} skills in {', '.join(set(missing_skill_categories[:3]))}")
                
                # Specific skill recommendations by category
                for category, subcategories in required_skills.items():
                    for subcat, skills in subcategories.items():
                        missing_skills = [skill for skill in skills if skill not in resume_lower]
                        if missing_skills and len(missing_skills) <= 3:
                            feedback.append(f"🔧 IMPROVE: Add {category.replace('_', ' ')} skills: {', '.join(missing_skills)}")
        
        # Education and certification gaps
        education_req = job_req.get('education_requirements', {})
        if education_req.get('degree_required'):
            degree_terms = ['bachelor', 'master', 'degree', 'bs', 'ms', 'phd']
            if not any(term in resume_lower for term in degree_terms):
                feedback.append("❌ FAULT: Education section missing or unclear")
                feedback.append("🔧 IMPROVE: Clearly state your degree and field of study")
        
        # Soft skills and culture fit analysis
        soft_skills = job_req.get('soft_skills', [])
        company_context = job_req.get('company_context', {})
        
        if culture_score < 70:
            missing_soft_skills = [skill for skill in soft_skills if skill not in resume_lower]
            if missing_soft_skills:
                feedback.append(f"❌ FAULT: Missing soft skills emphasized in job posting")
                feedback.append(f"🔧 IMPROVE: Incorporate these soft skills: {', '.join(missing_soft_skills[:3])}")
            
            # Company culture alignment
            if company_context.get('startup') and 'agile' not in resume_lower:
                feedback.append("🔧 IMPROVE: Highlight agile/fast-paced work experience for startup environment")
            elif company_context.get('enterprise') and 'scale' not in resume_lower:
                feedback.append("🔧 IMPROVE: Emphasize large-scale project experience for enterprise role")
        
        # Format and ATS optimization
        if 'pdf' not in resume_lower:
            feedback.append("⚠️ RECOMMENDATION: Save resume as PDF for better ATS compatibility")
        
        # Overall improvement strategy
        if keyword_score < 60 or skills_score < 60:
            feedback.append("🎯 CRITICAL: Resume needs significant customization for this specific job")
            feedback.append("🔧 ACTION PLAN: Rewrite summary to mirror job description language")
        
        return feedback
