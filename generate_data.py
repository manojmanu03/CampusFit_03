# ===== generate_data.py =====
import pandas as pd
import numpy as np
from scipy.stats import truncnorm

np.random.seed(42)
num_samples = 5000

# More realistic CGPA distribution (bell curve with mean around 7.5)
def generate_realistic_cgpa(n):
    # Truncated normal distribution between 5.0 and 10.0
    # Mean around 7.5, standard deviation around 1.2
    a, b = (5.0 - 7.5) / 1.2, (10.0 - 7.5) / 1.2
    cgpa = truncnorm.rvs(a, b, loc=7.5, scale=1.2, size=n)
    return np.round(cgpa, 2)

cgpa = generate_realistic_cgpa(num_samples)

# Generate correlated data based on CGPA
def generate_correlated_metrics(cgpa_values, base_range, correlation_factor=0.6):
    """Generate metrics that correlate with CGPA"""
    n = len(cgpa_values)
    # Create correlated noise
    correlated_noise = correlation_factor * (cgpa_values - np.mean(cgpa_values)) / np.std(cgpa_values)
    # Add random component
    random_component = np.random.normal(0, 1, n)
    # Combine and scale to desired range
    combined = correlated_noise + (1 - correlation_factor) * random_component
    # Normalize and scale to range
    normalized = (combined - np.min(combined)) / (np.max(combined) - np.min(combined))
    return np.round(normalized * (base_range[1] - base_range[0]) + base_range[0]).astype(int)

# Generate metrics with CGPA correlation
certifications = generate_correlated_metrics(cgpa, (0, 8), 0.5)
internship = generate_correlated_metrics(cgpa, (0, 2), 0.4)
projects = generate_correlated_metrics(cgpa, (0, 6), 0.6)
aptitude = generate_correlated_metrics(cgpa, (0, 10), 0.3)
technical = generate_correlated_metrics(cgpa, (0, 10), 0.5)
communication = generate_correlated_metrics(cgpa, (0, 10), 0.4)
resume = generate_correlated_metrics(cgpa, (1, 10), 0.3)

# Backlogs should be inversely correlated with CGPA
backlogs_raw = generate_correlated_metrics(cgpa, (0, 4), -0.7)  # Negative correlation
backlogs = np.maximum(0, backlogs_raw)  # Ensure non-negative

# Hackathon participation (binary with some CGPA correlation)
hackathon_prob = 0.3 + 0.4 * (cgpa - 5.0) / 5.0  # Higher CGPA = higher hackathon probability
hackathon = np.random.binomial(1, np.clip(hackathon_prob, 0, 1))

# Branch distribution with realistic proportions
branch_codes = ['CSE', 'ECE', 'MECH', 'CIVIL', 'ISE', 'AI&DS']
branch_probs = [0.35, 0.25, 0.20, 0.10, 0.05, 0.05]  # More realistic proportions
branch = np.random.choice(branch_codes, num_samples, p=branch_probs)

# More balanced branch scoring (reduced bias)
branch_map = {'CSE': 3, 'ISE': 3, 'ECE': 2, 'MECH': 1, 'CIVIL': 1, 'AI&DS': 3}
branch_marks = [branch_map.get(b, 1) for b in branch]

# Improved placement scoring with more realistic weights
placement_scores = []
placement_readiness = []

for i in range(num_samples):
    # Branch-based scoring adjustment
    branch_weights = {
        'CSE': 5.0,
        'AI&DS': 5.0,
        'ISE': 4.5,
        'ECE': 4.0,
        'MECH': 3.5,
        'CIVIL': 3.5
    }

    # Base score calculation with more balanced weights
    base_score = (
        cgpa[i] * 6.0 +           # Increased CGPA importance
        certifications[i] * 2.0 +  # Slightly increased
        internship[i] * 8.0 +      # Significantly increased for real experience
        projects[i] * 3.0 +        # More weight on projects
        aptitude[i] * 2.5 +        # Increased aptitude importance
        technical[i] * 4.0 +       # Doubled technical importance
        communication[i] * 3.0 +   # Doubled communication importance
        resume[i] * 1.5 +          # Slightly increased
        hackathon[i] * 3.0 +      # Increased hackathon value
        backlogs[i] * (-4.0) +    # Doubled backlog penalty
        branch_weights.get(branch[i], 3.0)  # Branch-specific bonus
    )
    
    # Normalize score to 0-100 range with better distribution
    max_possible_score = (
        10.0 * 6.0 +    # Max CGPA
        20.0 * 2.0 +    # Max certifications
        10.0 * 8.0 +    # Max internships
        15.0 * 3.0 +    # Max projects
        10.0 * 2.5 +    # Max aptitude
        10.0 * 4.0 +    # Max technical
        10.0 * 3.0 +    # Max communication
        10.0 * 1.5 +    # Max resume
        1.0 * 3.0 +     # Max hackathon
        5.0            # Max branch weight
    )
    
    # Normalize score to 0-100 range
    score = (base_score / max_possible_score) * 100
    score = max(0, min(100, score))
    placement_scores.append(score)
    
    # More realistic placement readiness threshold with stricter criteria
    min_cgpa = 6.5
    min_score = 30.0  # Adjusted for normalized scores
    max_backlogs = 3
    
    is_ready = (score >= min_score and 
                cgpa[i] >= min_cgpa and 
                backlogs[i] <= max_backlogs)
    
    placement_readiness.append(1 if is_ready else 0)

# Improved company fit logic with stricter criteria
company_fit = []
for i in range(num_samples):
    if placement_readiness[i] == 1:
        if placement_scores[i] >= 45 and cgpa[i] >= 8.5 and backlogs[i] <= 1:  # Adjusted for normalized scores
            company_fit.append("Tier 1")
        elif placement_scores[i] >= 35 and cgpa[i] >= 7.5 and backlogs[i] <= 2:  # Adjusted for normalized scores
            company_fit.append("Tier 2")
        elif placement_scores[i] >= 30 and cgpa[i] >= 6.5:  # Adjusted for normalized scores
            company_fit.append("Tier 3")
        else:
            company_fit.append("Not Eligible")
    else:
        company_fit.append("Not Eligible")

# Create DataFrame
data = pd.DataFrame({
    'cgpa': cgpa,
    'backlogs': backlogs,
    'certifications': certifications,
    'internship': internship,
    'aptitude': aptitude,
    'technical': technical,
    'communication': communication,
    'projects': projects,
    'hackathon': hackathon,
    'resume': resume,
    'branch': branch,
    'placement_readiness': placement_readiness,
    'company_fit': company_fit,
    'placement_score': placement_scores
})

# Add some data validation and cleaning
print("Data Generation Summary:")
print(f"Total samples: {len(data)}")
print(f"Placement ready: {data['placement_readiness'].sum()} ({data['placement_readiness'].mean()*100:.1f}%)")
print(f"CGPA range: {data['cgpa'].min():.2f} - {data['cgpa'].max():.2f}")
print(f"Score range: {data['placement_score'].min():.2f} - {data['placement_score'].max():.2f}")
print(f"Branch distribution:")
print(data['branch'].value_counts())
print(f"Company fit distribution:")
print(data['company_fit'].value_counts())

# Save the improved data
data.to_csv('data/placement_data.csv', index=False)
print("\nImproved data saved to 'data/placement_data.csv'")
