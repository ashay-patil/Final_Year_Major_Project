from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json

from insurance.claim_service import (
    create_claim, get_claim, get_all_claims, transition_state,
    calculate_amounts, get_review_payload, get_pending_reviews,
    validate_claim_for_submission
)
from insurance.audit import write_audit_event
from insurance.workflow.graph import InsuranceWorkflow
from insurance.workflow.states import ClaimState
from database import db

insurance_router = APIRouter(prefix="/api/insurance", tags=["Insurance"])
workflow = InsuranceWorkflow()

# Patient + ABHA
@insurance_router.post("/patients/{patient_id}/register")
def register_patient_claim(patient_id: str):
    try:
        claim_id = create_claim(patient_id)
        # Assuming create_claim handles the initial DB insertion, we advance to link abha
        # Actually workflow initializes state
        from insurance.workflow.persistence import save_state
        save_state(claim_id, ClaimState.REGISTERED)
        write_audit_event(claim_id, "System", "Claim registered", "Success", {})
        return {"claim_id": claim_id, "status": "REGISTERED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.post("/patients/{patient_id}/cashless-selection")
def select_cashless(patient_id: str, claim_id: str = Form(...)):
    try:
        # Advance through states
        result = workflow.advance(claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Claim management
@insurance_router.post("/claims/{claim_id}/insurance-info")
def capture_insurance_info(claim_id: str, info: dict):
    try:
        write_audit_event(claim_id, "System", "Captured insurance info", "Success", info)
        result = workflow.advance(claim_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.get("/claims/{claim_id}/tieup-status")
def get_tieup_status(claim_id: str):
    try:
        # Ideally checks with adapters or DB
        return {"claim_id": claim_id, "tieup_status": "TIED_UP"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.post("/claims/{claim_id}/documents")
def upload_documents(claim_id: str, file: UploadFile = File(...)):
    try:
        # Save file logic would go here
        write_audit_event(claim_id, "System", f"Document uploaded: {file.filename}", "Success", {})
        return {"status": "uploaded", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.get("/claims/{claim_id}/missing-documents")
def get_missing_documents(claim_id: str):
    try:
        return {"claim_id": claim_id, "missing": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.post("/claims/{claim_id}/policy/ask")
def ask_policy(claim_id: str, payload: dict):
    try:
        # from insurance.rag.policy_rag import ask_policy
        # answer = ask_policy(claim_id, payload.get("question"))
        answer = "This is a simulated RAG response about the policy."
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# HITL Review
@insurance_router.get("/claims/{claim_id}/review")
def get_claim_review(claim_id: str):
    try:
        payload = get_review_payload(claim_id)
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ReviewDecision(BaseModel):
    action: str  # "approve", "reject", "query"
    notes: Optional[str] = ""
    edited_fields: Optional[Dict[str, Any]] = None

@insurance_router.post("/claims/{claim_id}/review")
def submit_review(claim_id: str, decision: ReviewDecision):
    try:
        result = workflow.resume_after_review(
            claim_id, decision.action, decision.notes, decision.edited_fields
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Claim status
@insurance_router.get("/claims/{claim_id}")
def get_claim_details(claim_id: str):
    try:
        return get_claim(claim_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Claim not found")

@insurance_router.get("/claims/{claim_id}/audit")
def get_audit_trail(claim_id: str):
    try:
        events = list(db["claim_status_history"].find({"claim_id": claim_id}, {"_id": 0}))
        return {"audit_events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Insurer response simulation
@insurance_router.post("/claims/{claim_id}/insurer-response")
def simulate_insurer_response(claim_id: str, payload: dict):
    try:
        # Mock logic
        return {"status": "recorded", "insurer_response": payload}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Payment
@insurance_router.post("/claims/{claim_id}/mark-payment-received")
def mark_payment_received(claim_id: str):
    try:
        from insurance.workflow.persistence import save_state
        save_state(claim_id, ClaimState.PAYMENT_RECEIVED)
        workflow.advance(claim_id)
        return {"status": "payment_received", "claim_id": claim_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Directory + Dashboard
@insurance_router.get("/insurer-directory")
def get_insurer_directory():
    try:
        return {"insurers": list(db["insurer_directory"].find({}, {"_id": 0}))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.post("/insurer-directory")
def add_to_insurer_directory(insurer: dict):
    try:
        db["insurer_directory"].insert_one(insurer)
        return {"status": "added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.get("/claims")
def list_all_claims():
    try:
        return {"claims": get_all_claims()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.get("/human-reviews/pending")
def list_pending_reviews():
    try:
        return {"reviews": get_pending_reviews()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
