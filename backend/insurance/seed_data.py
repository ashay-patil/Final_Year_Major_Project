import uuid
from datetime import datetime
from database import db

def seed_insurance_data():
    """Seeds insurer directory + demo claim for HITL review testing."""
    
    # Clear old seed data
    db["insurer_directory"].delete_many({})
    db["claims"].delete_many({"patient_id": "PAT001"})
    db["claim_status_history"].delete_many({"claim_id": {"$regex": "^CLM-DEMO"}})
    db["insurance_audit_events"].delete_many({"claim_id": {"$regex": "^CLM-DEMO"}})
    db["workflow_states"].delete_many({"claim_id": {"$regex": "^CLM-DEMO"}})
    db["insurance_documents"].delete_many({"claim_id": {"$regex": "^CLM-DEMO"}})
    db["insurance_policies_v2"].delete_many({"patient_id": "PAT001"})
    
    # 5 insurer directory entries
    insurers = [
        {"name": "Star Health", "tied_up": True, "type": "cashless", "claim_channel": "hcx", "claim_email": "claims@starhealth.demo", "network_hospitals": 12000, "verification_status": "verified", "hcx_participant_code": "STAR-HCX-001"},
        {"name": "HDFC ERGO", "tied_up": True, "type": "cashless", "claim_channel": "hcx", "claim_email": "claims@hdfcergo.demo", "network_hospitals": 13000, "verification_status": "verified", "hcx_participant_code": "HDFC-HCX-002"},
        {"name": "Niva Bupa", "tied_up": True, "type": "cashless", "claim_channel": "email", "claim_email": "claims@nivabupa.demo", "network_hospitals": 10000, "verification_status": "verified"},
        {"name": "ICICI Lombard", "tied_up": False, "type": "reimbursement", "claim_channel": "email", "claim_email": "claims@icicilombard.demo", "network_hospitals": 8500, "verification_status": "unverified"},
        {"name": "Bajaj Allianz", "tied_up": False, "type": "reimbursement", "claim_channel": "email", "claim_email": "claims@bajaj.demo", "network_hospitals": 9000, "verification_status": "unverified"}
    ]
    db["insurer_directory"].insert_many(insurers)
    
    # Fetch existing PAT001 from patients collection
    patient = db["patients"].find_one({"patient_id": "PAT001"}, {"_id": 0})
    patient_name = patient.get("name", "John Smith") if patient else "John Smith"
    diagnosis = patient.get("diagnosis", "Acute Myocardial Infarction") if patient else "Acute Myocardial Infarction"
    
    # Create demo claim at WAITING_FOR_HUMAN_APPROVAL
    claim_id = "CLM-DEMO-001"
    claim = {
        "claim_id": claim_id,
        "patient_id": "PAT001",
        "patient_name": patient_name,
        "state": "WAITING_FOR_HUMAN_APPROVAL",
        "insurer_name": "Star Health",
        "policy_number": "POL-SH-2026-45678",
        "member_id": "MEM-SH-12345",
        "policy_type": "individual",
        "diagnosis": diagnosis,
        "bill_amount": 185000,
        "approved_amount": 0,
        "received_amount": 0,
        "channel": "hcx",
        "policy_findings": "Coverage includes cardiac procedures up to \u20b95,00,000. Co-pay: 10%. Room rent limit: \u20b94,000/day. Pre-authorization required for cardiac interventions.",
        "abha_number": "SANDBOX-91-4523-7891-2345",
        "cashless_selected": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db["claims"].insert_one(claim)
    
    # Insert workflow state
    db["workflow_states"].insert_one({
        "claim_id": claim_id,
        "current_state": "WAITING_FOR_HUMAN_APPROVAL",
        "pending_action": "human_review",
        "updated_at": datetime.utcnow()
    })
    
    # Insert insurance policy
    db["insurance_policies_v2"].insert_one({
        "patient_id": "PAT001",
        "policy_number": "POL-SH-2026-45678",
        "member_id": "MEM-SH-12345",
        "insurer_name": "Star Health",
        "policy_type": "individual",
        "max_coverage": 500000,
        "policy_text": "Star Health Family Health Optima Policy. Coverage: Up to Rs 5,00,000 per annum. Covers: All hospitalization including cardiac, surgical, and general medical conditions. Room Rent: Rs 4,000 per day. Co-pay: 10% of admissible claim. Pre-authorization: Required for planned surgeries and cardiac interventions. Waiting Period: 30 days for new policies. Exclusions: Cosmetic procedures, dental treatments. Network: 12,000+ hospitals across India.",
        "created_at": datetime.utcnow()
    })
    
    # Insert demo documents
    db["insurance_documents"].insert_many([
        {"claim_id": claim_id, "doc_type": "insurance_card", "filename": "insurance_card.jpg", "ocr_extracted_fields": {"policy_number": "POL-SH-2026-45678", "member_id": "MEM-SH-12345", "insurer": "Star Health"}, "ocr_confidence": 0.92, "status": "collected", "uploaded_at": datetime.utcnow()},
        {"claim_id": claim_id, "doc_type": "id_proof", "filename": "aadhaar_card.jpg", "ocr_extracted_fields": {"name": patient_name, "id_number": "XXXX-XXXX-4567"}, "ocr_confidence": 0.88, "status": "collected", "uploaded_at": datetime.utcnow()},
    ])
    
    # Insert status history
    states_progression = [
        ("REGISTERED", "CASHLESS_SELECTED"),
        ("CASHLESS_SELECTED", "INSURANCE_CAPTURED"),
        ("INSURANCE_CAPTURED", "INSURER_CHECKED"),
        ("INSURER_CHECKED", "TIE_UP_CONFIRMED"),
        ("TIE_UP_CONFIRMED", "DOCUMENTS_COLLECTED"),
        ("DOCUMENTS_COLLECTED", "POLICY_ANALYZED"),
        ("POLICY_ANALYZED", "CLAIM_PREPARED"),
        ("CLAIM_PREPARED", "WAITING_FOR_HUMAN_APPROVAL"),
    ]
    for i, (old, new) in enumerate(states_progression):
        db["claim_status_history"].insert_one({
            "claim_id": claim_id,
            "old_state": old,
            "new_state": new,
            "actor": "system",
            "reason": "Workflow progression",
            "timestamp": datetime(2026, 9, 16, 10, 0+i, 0)
        })
    
    # Seed policy into ChromaDB for RAG
    try:
        from insurance.rag.policy_index import index_policy_document
        policy_text = db["insurance_policies_v2"].find_one({"patient_id": "PAT001"}).get("policy_text", "")
        if policy_text:
            index_policy_document("PAT001", "POL-SH-2026-45678", policy_text)
    except Exception as e:
        print(f"RAG indexing skipped: {e}")
    
    return {"insurers": len(insurers), "claims": 1, "documents": 2, "claim_id": claim_id}
