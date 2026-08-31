import qrcode
from io import BytesIO
import base64
import json

def generate_patient_qr(patient: dict, base_url: str = "http://localhost:5173") -> dict:
    """Generate a QR code containing patient data, sized to fit within QR limits."""
    patient_id = patient.get('patient_id', '')
    
    # Build patient data for QR — keep it compact to stay within QR version 40 limit
    qr_payload = {
        "s": "MediFlow",
        "id": patient_id,
        "n": patient.get('name', 'Unknown'),
        "a": patient.get('age', ''),
        "dx": patient.get('diagnosis', ''),
        "dt": patient.get('admission_date', ''),
        "st": patient.get('status', 'pending'),
        "dr": patient.get('doctor', ''),
        "rm": patient.get('room', patient.get('bed_number', '')),
    }
    
    # Add vitals compactly if available
    vitals = patient.get('vital_signs', {})
    if vitals:
        qr_payload["v"] = {
            "bp": vitals.get('blood_pressure', ''),
            "hr": str(vitals.get('heart_rate', '')),
            "t": str(vitals.get('temperature', '')),
            "o2": str(vitals.get('oxygen_saturation', '')),
        }
    
    # Add up to 3 medication names only
    meds = patient.get('medications', patient.get('prescription', []))
    if meds:
        if isinstance(meds, list):
            med_names = [str(m.get('name', m) if isinstance(m, dict) else m) for m in meds[:3]]
        else:
            med_names = [str(meds)]
        qr_payload["rx"] = med_names
    
    # Encode as compact JSON
    qr_data = json.dumps(qr_payload, separators=(',', ':'))
    
    # If data is still too large (>2000 chars), trim to essentials
    if len(qr_data) > 2000:
        qr_payload = {
            "s": "MediFlow",
            "id": patient_id,
            "n": patient.get('name', 'Unknown'),
            "dx": patient.get('diagnosis', ''),
            "st": patient.get('status', 'pending'),
        }
        qr_data = json.dumps(qr_payload, separators=(',', ':'))
    
    # Generate QR code — use ERROR_CORRECT_L for maximum data capacity
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    # Standard black on white for best visibility & scannability
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    qr_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return {
        "qr_base64": f"data:image/png;base64,{qr_base64}",
        "patient_id": patient_id,
        "encoded_data": qr_data
    }
