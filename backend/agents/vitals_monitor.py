import random
import datetime

def generate_vitals_history(patient: dict) -> list[dict]:
    """Returns 24 data points (one per hour) with realistic vital sign readings"""
    history = []
    
    # Base values
    vitals = patient.get('vital_signs', {})
    bp = vitals.get('blood_pressure', '120/80').split('/')
    try:
        base_sys, base_dia = int(bp[0]), int(bp[1])
    except:
        base_sys, base_dia = 120, 80
        
    base_hr = vitals.get('heart_rate', 80)
    base_temp = vitals.get('temperature', 98.6)
    base_o2 = vitals.get('oxygen_saturation', 98)
    base_rr = vitals.get('respiratory_rate', 16)
    
    current_time = datetime.datetime.utcnow()
    
    for i in range(24):
        time_point = current_time - datetime.timedelta(hours=23 - i)
        
        # Random variation
        sys_val = base_sys + random.randint(-5, 5)
        dia_val = base_dia + random.randint(-5, 5)
        hr_val = base_hr + random.randint(-3, 3)
        temp_val = round(base_temp + random.uniform(-0.3, 0.3), 1)
        o2_val = min(100, max(80, base_o2 + random.randint(-1, 1)))
        rr_val = base_rr + random.randint(-2, 2)
        
        # 10% chance of anomaly
        if random.random() < 0.1:
            anomaly_type = random.choice(['bp', 'hr', 'temp', 'o2'])
            if anomaly_type == 'bp':
                sys_val += random.choice([-20, 25])
            elif anomaly_type == 'hr':
                hr_val += random.choice([-25, 30])
            elif anomaly_type == 'temp':
                temp_val += random.uniform(1.5, 2.5)
            elif anomaly_type == 'o2':
                o2_val -= random.randint(4, 8)
                
        history.append({
            "timestamp": time_point.isoformat() + "Z",
            "bp_systolic": sys_val,
            "bp_diastolic": dia_val,
            "heart_rate": hr_val,
            "temperature": temp_val,
            "oxygen_saturation": o2_val,
            "respiratory_rate": rr_val
        })
        
    return history

def detect_anomalies(vitals_history: list[dict]) -> list[dict]:
    """Returns list of anomalies detected in the vitals"""
    anomalies = []
    
    for reading in vitals_history:
        ts = reading['timestamp']
        sys = reading.get('bp_systolic', 120)
        dia = reading.get('bp_diastolic', 80)
        hr = reading.get('heart_rate', 80)
        temp = reading.get('temperature', 98.6)
        o2 = reading.get('oxygen_saturation', 98)
        rr = reading.get('respiratory_rate', 16)
        
        if sys > 140 or sys < 90:
            sev = 'critical' if sys > 160 or sys < 80 else 'warning'
            anomalies.append({
                "timestamp": ts, "vital_type": "bp_systolic", "value": sys,
                "normal_range": "90-140", "severity": sev, 
                "recommendation": "Review blood pressure medications and assess for symptoms."
            })
            
        if dia > 90 or dia < 60:
            sev = 'critical' if dia > 100 or dia < 50 else 'warning'
            anomalies.append({
                "timestamp": ts, "vital_type": "bp_diastolic", "value": dia,
                "normal_range": "60-90", "severity": sev,
                "recommendation": "Monitor BP closely."
            })
            
        if hr > 100 or hr < 60:
            anomalies.append({
                "timestamp": ts, "vital_type": "heart_rate", "value": hr,
                "normal_range": "60-100", "severity": "warning",
                "recommendation": "Check for pain, anxiety, or medication side effects."
            })
            
        if temp > 100.4 or temp < 96.8:
            sev = 'critical' if temp > 102.0 else 'warning'
            anomalies.append({
                "timestamp": ts, "vital_type": "temperature", "value": temp,
                "normal_range": "96.8-100.4", "severity": sev,
                "recommendation": "Evaluate for potential infection or environmental factors."
            })
            
        if o2 < 96:
            sev = 'critical' if o2 < 94 else 'warning'
            anomalies.append({
                "timestamp": ts, "vital_type": "oxygen_saturation", "value": o2,
                "normal_range": "> 96", "severity": sev,
                "recommendation": "Assess airway and consider supplemental oxygen."
            })
            
        if rr > 20 or rr < 12:
            anomalies.append({
                "timestamp": ts, "vital_type": "respiratory_rate", "value": rr,
                "normal_range": "12-20", "severity": "warning",
                "recommendation": "Observe work of breathing."
            })
            
    return anomalies
