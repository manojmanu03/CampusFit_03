# ===== test_predictor.py =====
from score_predictor import predict_score

# Test cases
test_cases = [
    {
        "name": "Excellent Student",
        "data": {
            "cgpa": 9.2,
            "backlogs": 0,
            "certifications": 6,
            "internship": 2,
            "aptitude": 9,
            "technical": 9,
            "communication": 8,
            "projects": 5,
            "hackathon": 1,
            "resume": 9,
            "branch": "CSE"
        }
    },
    {
        "name": "Good Student",
        "data": {
            "cgpa": 8.1,
            "backlogs": 1,
            "certifications": 4,
            "internship": 1,
            "aptitude": 7,
            "technical": 8,
            "communication": 7,
            "projects": 4,
            "hackathon": 1,
            "resume": 8,
            "branch": "ECE"
        }
    },
    {
        "name": "Average Student",
        "data": {
            "cgpa": 7.2,
            "backlogs": 2,
            "certifications": 3,
            "internship": 1,
            "aptitude": 6,
            "technical": 6,
            "communication": 6,
            "projects": 3,
            "hackathon": 0,
            "resume": 7,
            "branch": "MECH"
        }
    },
    {
        "name": "Below Average Student",
        "data": {
            "cgpa": 6.1,
            "backlogs": 3,
            "certifications": 2,
            "internship": 0,
            "aptitude": 5,
            "technical": 5,
            "communication": 5,
            "projects": 2,
            "hackathon": 0,
            "resume": 6,
            "branch": "CIVIL"
        }
    }
]

print("Testing Placement Prediction System\n")
print("=" * 50)

for case in test_cases:
    print(f"\nTesting {case['name']}:")
    print("-" * 30)
    
    result = predict_score(case['data'])
    
    print(f"CGPA: {case['data']['cgpa']}")
    print(f"Branch: {case['data']['branch']}")
    print(f"Placement Ready: {'Yes' if result['placement_readiness'] == 1 else 'No'}")
    print(f"Company Fit: {result['company_fit']}")
    print(f"Score: {result['calculated_score']:.2f}")
    
print("\n" + "=" * 50) 