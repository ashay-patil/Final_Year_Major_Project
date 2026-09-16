import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from database import db

def seed_insurance_data():
    """Seeds insurer directory + demo claim for testing."""
    # 5 insurer_directory entries (3 tied_up, 2 not_tied_up)
    db["insurer_directory"].delete_many({})
    insurers = [
        {"name": "Star Health", "tied_up": True, "type": "cashless"},
        {"name": "HDFC ERGO", "tied_up": True, "type": "cashless"},
        {"name": "Niva Bupa", "tied_up": True, "type": "cashless"},
        {"name": "ICICI Lombard", "tied_up": False, "type": "reimbursement"},
        {"name": "Bajaj Allianz", "tied_up": False, "type": "reimbursement"}
    ]
    db["insurer_directory"].insert_many(insurers)
    
    # 1 demo patient (PAT001) with ABHA + individual policy
    db["patients_collection"].update_one(
        {"patient_id": "PAT001"},
        {"$set": {
            "name": "Demo Patient",
            "abha_id": "ABHA-1234-5678-9012",
            "policy": {"insurer": "Star Health", "policy_number": "POL-123"}
        }},
        upsert=True
    )
    
    # A synthetic policy text for RAG
    db["insurance_policies_v2"].update_one(
        {"policy_number": "POL-123"},
        {"$set": {
            "policy_text": "This is a synthetic policy text for testing. Covers all hospitalization expenses up to 5 Lakhs.",
            "insurer": "Star Health"
        }},
        upsert=True
    )
    
    # Pre-uploaded document records
    db["insurance_documents"].delete_many({"claim_id": "CLM-DEMO-001"})
    db["insurance_documents"].insert_many([
        {"claim_id": "CLM-DEMO-001", "filename": "id_proof.pdf", "type": "ID"},
        {"claim_id": "CLM-DEMO-001", "filename": "medical_bill.pdf", "type": "BILL"}
    ])
    
    return {"insurers": len(insurers), "patients": 1, "documents": 2}
