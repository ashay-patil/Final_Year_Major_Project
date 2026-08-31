import os
import random
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from langchain_groq import ChatGroq

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

# Global trained model
rf_model = None

def _generate_training_data():
    """Generates synthetic training data and trains the RandomForestClassifier"""
    X = []
    y = []
    for _ in range(500):
        age = random.randint(18, 90)
        diagnosis_severity = random.choice([0.3, 0.4, 0.5, 0.6, 0.7, 0.9])
        bp_risk = random.uniform(0, 40)
        heart_rate_risk = random.uniform(0, 30)
        temperature_risk = random.uniform(0, 3)
        o2_risk = random.uniform(0, 10)
        length_of_stay = random.randint(1, 30)
        treatment_completed = random.choice([0, 1])
        
        features = [age, diagnosis_severity, bp_risk, heart_rate_risk, temperature_risk, o2_risk, length_of_stay, treatment_completed]
        X.append(features)
        
        # Simple heuristic for synthetic label
        risk_score = (diagnosis_severity * 30) + (bp_risk * 0.5) + (heart_rate_risk * 0.5) + (temperature_risk * 5) + (o2_risk * 2) + (age * 0.2)
        if treatment_completed == 1:
            risk_score -= 20
            
        y.append(1 if risk_score > 50 else 0)
        
    model = RandomForestClassifier(n_estimators=50, random_state=42)
    model.fit(X, y)
    return model

def predict_readmission_risk(patient: dict) -> dict:
    """Returns {risk_score: int (0-100), risk_level: str, contributing_factors: list[dict], ai_explanation: str}"""
    global rf_model
    if rf_model is None:
        rf_model = _generate_training_data()
        
    # Feature engineering from patient data
    age = patient.get('age', 50)
    
    diagnosis_map = {
        'cardiac': 0.9, 'stroke': 0.9,
        'surgery': 0.7, 'respiratory': 0.6,
        'diabetes': 0.5, 'fracture': 0.4
    }
    diag = patient.get('diagnosis', '').lower()
    diagnosis_severity = 0.3
    for k, v in diagnosis_map.items():
        if k in diag:
            diagnosis_severity = v
            break
            
    vitals = patient.get('vital_signs', {})
    bp = vitals.get('blood_pressure', '120/80').split('/')
    try:
        sys_bp, dia_bp = int(bp[0]), int(bp[1])
        bp_risk = abs(sys_bp - 120) + abs(dia_bp - 80)
    except:
        bp_risk = 0
        
    hr = vitals.get('heart_rate', 80)
    heart_rate_risk = 0
    if hr > 100: heart_rate_risk = hr - 100
    elif hr < 60: heart_rate_risk = 60 - hr
    
    temp = vitals.get('temperature', 98.6)
    temperature_risk = abs(temp - 98.6)
    
    o2 = vitals.get('oxygen_saturation', 98)
    o2_risk = max(0, 98 - o2)
    
    los = patient.get('length_of_stay', 5)
    treatment_completed = 1 if patient.get('treatment_status') == 'completed' else 0
    
    features = [[age, diagnosis_severity, bp_risk, heart_rate_risk, temperature_risk, o2_risk, los, treatment_completed]]
    
    # Calculate probabilities
    prob = rf_model.predict_proba(features)[0][1]
    risk_score = int(prob * 100)
    
    if risk_score > 70:
        risk_level = "High"
    elif risk_score > 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"
        
    contributing_factors = [
        {"name": "Diagnosis Severity", "impact": diagnosis_severity, "description": f"Based on diagnosis: {diag}"},
        {"name": "Vital Signs Stability", "impact": min(1.0, (bp_risk + heart_rate_risk + o2_risk)/100), "description": "Deviation from normal vital ranges"},
        {"name": "Treatment Completion", "impact": 1.0 if not treatment_completed else 0.1, "description": "Status of planned treatments"}
    ]
    
    # Generate AI explanation
    prompt = f"""
    You are a medical AI analyzing readmission risk for a patient.
    Patient: {patient.get('name', 'Unknown')}, Age: {age}, Diagnosis: {diag}
    Calculated Risk Score: {risk_score}/100 ({risk_level} Risk)
    
    Factors:
    - Diagnosis severity impact: {diagnosis_severity}
    - Vital signs deviation risk: {(bp_risk + heart_rate_risk + o2_risk)}
    - Treatment completed: {bool(treatment_completed)}
    
    Provide a brief, natural language explanation of this risk assessment (max 3 sentences).
    """
    
    response = groq_llm.invoke(prompt)
    ai_explanation = response.content.strip()
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "contributing_factors": contributing_factors,
        "ai_explanation": ai_explanation
    }
