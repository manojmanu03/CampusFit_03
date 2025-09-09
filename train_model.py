
# ===== train_model.py =====
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import joblib

print("Loading and preprocessing data...")

# Load and prepare data
data = pd.read_csv('data/placement_data.csv')

# Convert company_fit to numeric labels for training
company_fit_map = {
    'Tier 1': 3,
    'Tier 2': 2,
    'Tier 3': 1,
    'Not Eligible': 0
}
data['company_fit_numeric'] = data['company_fit'].map(company_fit_map)

# Prepare features
feature_cols = ['cgpa', 'backlogs', 'certifications', 'internship', 'aptitude', 
                'technical', 'communication', 'projects', 'hackathon', 'resume']

# One-hot encode categorical variables
X = pd.get_dummies(data[feature_cols + ['branch']], columns=['branch'])
y_placement = data['placement_readiness']
y_company = data['company_fit_numeric']

print(f"\nDataset shape: {X.shape}")
print(f"Features: {list(X.columns)}")

# Split data
X_train, X_test, y_placement_train, y_placement_test = train_test_split(
    X, y_placement, test_size=0.2, random_state=42
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("\nTraining models...")

# Train placement readiness model with current scikit-learn version
placement_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1  # Use all available cores
)
placement_model.fit(X_train_scaled, y_placement_train)

# Train company fit model with current scikit-learn version
company_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1  # Use all available cores
)
company_model.fit(X_train_scaled, y_company.loc[y_placement_train.index])

print("\nSaving models...")

# Save models and preprocessing objects
joblib.dump(placement_model, 'placement_model.pkl')
joblib.dump(company_model, 'company_fit_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(list(X.columns), 'feature_columns.pkl')

# Print model performance
print("\nPlacement Model Performance:")
print(f"Training accuracy: {placement_model.score(X_train_scaled, y_placement_train):.2f}")
print(f"Testing accuracy: {placement_model.score(X_test_scaled, y_placement_test):.2f}")

# Print feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': placement_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Important Features for Placement:")
print(feature_importance.head(10))

print("\nDone!")

