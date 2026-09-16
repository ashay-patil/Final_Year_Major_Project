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
    return db["claims"].find_one({"claim_id": claim_id}, {"_id": 0})


def get_all_claims():
    claims = list(db["claims"].find({}, {"_id": 0}))
    for c in claims:
        c["amounts"] = {
            "total_billed": c.get("bill_amount", 0),
            "approved_amount": c.get("approved_amount", 0),
            "received_amount": c.get("received_amount", 0),
        }
    return claims

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
    
    patient_id = claim.get("patient_id", "")
    patient = db["patients"].find_one({"patient_id": patient_id}, {"_id": 0})
    
    # Get insurance policy info
    policy = db["insurance_policies_v2"].find_one({"patient_id": patient_id}, {"_id": 0})
    
    # Get insurer directory entry
    insurer_name = claim.get("insurer_name", "")
    insurer = db["insurer_directory"].find_one({"name": insurer_name}, {"_id": 0}) if insurer_name else None
    
    # Get documents
    docs = list(db["insurance_documents"].find({"claim_id": claim_id}, {"_id": 0}))
    
    # Get required doc types and figure out what's missing
    required_doc_types = ["insurance_card", "id_proof", "prescription", "discharge_summary"]
    collected_types = [d.get("doc_type") for d in docs]
    missing_docs = [t for t in required_doc_types if t not in collected_types]
    
    # Get status history
    history = list(db["claim_status_history"].find({"claim_id": claim_id}, {"_id": 0}).sort("timestamp", 1))
    
    # Get audit events
    from insurance.audit import audit_events_collection
    audit = list(audit_events_collection.find({"claim_id": claim_id}, {"_id": 0}).sort("timestamp", 1))
    
    return {
        "claim_id": claim_id,
        "claim": claim,
        "patient": patient or {},
        "insurance": policy or {},
        "insurer_directory": insurer or {},
        "documents": docs,
        "missing_docs": missing_docs,
        "amounts": {
            "bill_amount": claim.get("bill_amount", 0),
            "total_billed": claim.get("bill_amount", 0),  # alias for frontend
            "approved_amount": claim.get("approved_amount", 0),
            "estimated_coverage": claim.get("approved_amount", 0) or claim.get("bill_amount", 0) * 0.9,  # estimate if not yet approved
            "received_amount": claim.get("received_amount", 0),
            "patient_payable": max(0, claim.get("bill_amount", 0) - (claim.get("approved_amount", 0) or claim.get("bill_amount", 0) * 0.9)),
        },
        "channel": claim.get("channel", "hcx"),
        "verification_status": insurer.get("verification_status", "verified") if insurer else "unknown",
        "policy_findings": claim.get("policy_findings", ""),
        "history": history,
        "audit_events": audit,
        "state": claim.get("state", "")
    }

def get_pending_reviews():
    claims = list(db["claims"].find({"state": "WAITING_FOR_HUMAN_APPROVAL"}, {"_id": 0}))
    enriched = []
    for claim in claims:
        patient = db["patients"].find_one({"patient_id": claim.get("patient_id")}, {"_id": 0})
        policy = db["insurance_policies_v2"].find_one({"patient_id": claim.get("patient_id")}, {"_id": 0})
        enriched.append({
            **claim,
            "patient": patient or {},
            "insurance": policy or {"insurer_name": claim.get("insurer_name", "")},
            "amounts": {
                "total_billed": claim.get("bill_amount", 0),
                "approved_amount": claim.get("approved_amount", 0),
            },
            "channel": claim.get("channel", "hcx"),
        })
    return enriched

def validate_claim_for_submission(claim_id):
    claim = get_claim(claim_id)
    if not claim:
        return {"valid": False, "reason": "Claim not found"}
        
    required = ["patient_id", "policy_number"]
    for req in required:
        if not claim.get(req):
            return {"valid": False, "reason": f"Missing {req}"}
            
    return {"valid": True, "reason": "Valid"}
