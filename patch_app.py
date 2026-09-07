import sys

with open('backend/app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if line.startswith('def get_patients():'):
        new_lines.append(line)
        new_lines.append('    """Get all patients"""\n')
        new_lines.append('    patients = list(patients_collection.find({}, {"_id": 0}))\n')
        new_lines.append('    \n')
        new_lines.append('    # Augment with anomaly detection using existing backend logic\n')
        new_lines.append('    try:\n')
        new_lines.append('        from agents.vitals_monitor import detect_anomalies\n')
        new_lines.append('        from datetime import datetime\n')
        new_lines.append('        for p in patients:\n')
        new_lines.append('            vitals = p.get("vital_signs", {})\n')
        new_lines.append('            bp = vitals.get("blood_pressure", "120/80").split("/")\n')
        new_lines.append('            try:\n')
        new_lines.append('                sys_bp, dia_bp = int(bp[0]), int(bp[1])\n')
        new_lines.append('            except:\n')
        new_lines.append('                sys_bp, dia_bp = 120, 80\n')
        new_lines.append('                \n')
        new_lines.append('            current_reading = {\n')
        new_lines.append('                "timestamp": datetime.utcnow().isoformat() + "Z",\n')
        new_lines.append('                "bp_systolic": sys_bp,\n')
        new_lines.append('                "bp_diastolic": dia_bp,\n')
        new_lines.append('                "heart_rate": vitals.get("heart_rate", 80),\n')
        new_lines.append('                "temperature": vitals.get("temperature", 98.6),\n')
        new_lines.append('                "oxygen_saturation": vitals.get("oxygen_saturation", 98),\n')
        new_lines.append('                "respiratory_rate": vitals.get("respiratory_rate", 16)\n')
        new_lines.append('            }\n')
        new_lines.append('            \n')
        new_lines.append('            anomalies = detect_anomalies([current_reading])\n')
        new_lines.append('            p["has_anomalies"] = len(anomalies) > 0\n')
        new_lines.append('            p["anomalies"] = anomalies\n')
        new_lines.append('    except Exception as e:\n')
        new_lines.append('        print(f"Error augmenting anomalies: {e}")\n')
        new_lines.append('        pass\n')
        new_lines.append('        \n')
        new_lines.append('    return {"patients": patients}\n')
        skip = True
        continue
    
    if skip and 'return' in line and '{"patients": patients}' in line:
        skip = False
        continue
        
    if not skip:
        if 'patients = list(patients_collection.find({}, {"_id": 0}))' not in line and '"""Get all patients"""' not in line:
            new_lines.append(line)

with open('backend/app.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Success')
