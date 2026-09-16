def patient_to_fhir(patient_dict):
    return {
        "resourceType": "Patient",
        "id": patient_dict.get("patient_id"),
        "name": [{"text": patient_dict.get("name")}],
    }

def encounter_to_fhir(encounter_dict):
    return {
        "resourceType": "Encounter",
        "id": encounter_dict.get("encounter_id"),
        "status": encounter_dict.get("status", "finished"),
        "subject": {"reference": f"Patient/{encounter_dict.get('patient_id')}"}
    }

def claim_to_fhir(claim_dict):
    return {
        "resourceType": "Claim",
        "id": claim_dict.get("claim_id"),
        "status": "active",
        "type": {"coding": [{"code": "institutional"}]},
        "patient": {"reference": f"Patient/{claim_dict.get('patient_id')}"},
        "total": {"value": claim_dict.get("bill_amount", 0), "currency": "INR"}
    }
