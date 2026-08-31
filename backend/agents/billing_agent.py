from datetime import datetime

def calculate_bill(patient):
    """Calculate total bill for patient in Indian Rupees (INR)"""
    
    # Base costs in INR
    room_cost_per_day = 2000  # ₹2,000 per day
    doctor_consultation = 1500  # ₹1,500
    nursing_care_per_day = 800  # ₹800 per day
    
    # Calculate days stayed
    admission_date = datetime.strptime(patient["admission_date"], "%Y-%m-%d")
    days_stayed = max((datetime.utcnow() - admission_date).days, 1)  # Minimum 1 day

    # Base charges
    room_charges = room_cost_per_day * days_stayed
    doctor_charges = doctor_consultation
    nursing_charges = nursing_care_per_day * days_stayed
    prescription_cost = 1200  # Base prescription cost
    
    # Diagnosis-specific additional charges
    additional_cost = 0
    diagnosis_lower = patient["diagnosis"].lower()
    additional_items = []
    
    if "heart" in diagnosis_lower or "myocardial" in diagnosis_lower or "cardiac" in diagnosis_lower:
        additional_cost = 15000  # Cardiac care package
        additional_items.append("Cardiac Monitoring & ECG")
        additional_items.append("Cardiology Consultation")
        prescription_cost = 3500  # Cardiac medications are expensive
        
    elif "stroke" in diagnosis_lower:
        additional_cost = 18000  # Stroke care
        additional_items.append("CT/MRI Scan")
        additional_items.append("Neurology Consultation")
        additional_items.append("Physiotherapy Sessions")
        prescription_cost = 4000
        
    elif "surgery" in diagnosis_lower or "fracture" in diagnosis_lower or "appendicitis" in diagnosis_lower:
        additional_cost = 25000  # Surgical care
        additional_items.append("Operation Theatre Charges")
        additional_items.append("Anesthesia")
        additional_items.append("Surgical Supplies")
        prescription_cost = 2500
        
    elif "pneumonia" in diagnosis_lower or "copd" in diagnosis_lower or "asthma" in diagnosis_lower:
        additional_cost = 8000  # Respiratory care
        additional_items.append("Chest X-Ray")
        additional_items.append("Oxygen Therapy")
        additional_items.append("Nebulization")
        prescription_cost = 2800
        
    elif "diabetes" in diagnosis_lower:
        additional_cost = 5000  # Diabetes management
        additional_items.append("Blood Sugar Monitoring")
        additional_items.append("HbA1c Test")
        additional_items.append("Diabetes Education")
        prescription_cost = 3200
        
    else:
        additional_cost = 3000  # General medical care
        additional_items.append("Laboratory Tests")
        additional_items.append("Medical Supplies")
    
    # Calculate total
    total = (room_charges + doctor_charges + nursing_charges + 
             prescription_cost + additional_cost)
    
    # Add 18% GST
    gst_amount = total * 0.18
    final_total = total + gst_amount
    
    return {
        "patient_id": patient["patient_id"],
        "patient_name": patient["name"],
        "admission_date": patient["admission_date"],
        "discharge_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "days_stayed": days_stayed,
        "breakdown": {
            "room_charges": room_charges,
            "doctor_charges": doctor_charges,
            "nursing_charges": nursing_charges,
            "prescription_cost": prescription_cost,
            "additional_charges": additional_cost,
            "additional_items": additional_items,
            "subtotal": total,
            "gst_18_percent": gst_amount
        },
        "total_amount": round(final_total, 2),
        "currency": "INR",
        "currency_symbol": "₹"
    }