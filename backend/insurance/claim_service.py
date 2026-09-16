import uuid
from datetime import datetime
from database import db
from insurance.audit import write_audit_event

def create_claim(patient_id):
    claim_id = str(uuid.uuid4())
    claim = {
        "claim_id": claim_id,
        "patient_id": patient_id,
        "state": "REGISTERED",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "bill_amount": 0,
        "approved_amount": 0,
        "received_amount": 0
    }
    db["claims"].insert_one(claim)
    write_audit_event(claim_id, "system", "PATIENT_REGISTERED")
    return claim

def get_claim(claim_id):
    return db["claims"].find_one({"claim_id": claim_id})

def get_all_claims():
    return list(db["claims"].find({}))

def transition_state(claim_id, new_state, actor, reason=""):
    claim = db["claims"].find_one({"claim_id": claim_id})
    if not claim:
        raise ValueError("Claim not found")
        
    old_state = claim.get("state")
    
    db["claims"].update_one(
        {"claim_id": claim_id},
        {"$set": {"state": new_state, "updated_at": datetime.utcnow()}}
    )
    
    db["claim_status_history"].insert_one({
        "claim_id": claim_id,
        "old_state": old_state,
        "new_state": new_state,
        "actor": actor,
        "reason": reason,
        "timestamp": datetime.utcnow()
    })
    
    # Audit event name matches new state if possible, else just generic
    event_name = new_state if new_state in [
        "CLAIM_SUBMITTED", "CLAIM_REJECTED", "CLAIM_APPROVED", "PAYMENT_RECEIVED", "CLAIM_COMPLETED"
    ] else "STATE_TRANSITION"
    
    write_audit_event(claim_id, actor, event_name, metadata={"from": old_state, "to": new_state, "reason": reason})
    return True

def calculate_amounts(claim_id, approved_amount=0, received_amount=0):
    claim = db["claims"].find_one({"claim_id": claim_id})
    if not claim:
        raise ValueError("Claim not found")
        
    new_approved = claim.get("approved_amount", 0) + float(approved_amount)
    new_received = claim.get("received_amount", 0) + float(received_amount)
    
    db["claims"].update_one(
        {"claim_id": claim_id},
        {"$set": {
            "approved_amount": new_approved,
            "received_amount": new_received,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"approved_amount": new_approved, "received_amount": new_received}

def get_review_payload(claim_id):
    claim = get_claim(claim_id)
    if not claim:
        return None
    docs = list(db["claim_documents"].find({"claim_id": claim_id}))
    return {
        "claim": claim,
        "documents": docs
    }

def get_pending_reviews():
    return list(db["claims"].find({"state": "WAITING_FOR_HUMAN_APPROVAL"}))

def validate_claim_for_submission(claim_id):
    claim = get_claim(claim_id)
    if not claim:
        return {"valid": False, "reason": "Claim not found"}
        
    required = ["patient_id", "policy_number"]
    for req in required:
        if not claim.get(req):
            return {"valid": False, "reason": f"Missing {req}"}
            
    return {"valid": True, "reason": "Valid"}
