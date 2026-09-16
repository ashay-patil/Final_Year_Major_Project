from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from insurance.claim_service import (
    create_claim, get_claim, get_all_claims, transition_state,
    calculate_amounts, get_review_payload, get_pending_reviews,
    validate_claim_for_submission
)
from insurance.audit import write_audit_event
from insurance.workflow.graph import InsuranceWorkflow
from insurance.workflow.states import ClaimState
from insurance.workflow.persistence import save_state, load_state
from database import db

insurance_router = APIRouter(prefix="/api/insurance", tags=["Insurance"])
workflow = InsuranceWorkflow()


@insurance_router.post("/patients/{patient_id}/register")
def register_patient_claim(patient_id: str):
    try:
        claim = create_claim(patient_id)
        claim_id = claim["claim_id"]
        
        # Link ABHA
        from insurance.adapters import get_abdm_adapter
        abdm = get_abdm_adapter()
        abha_result = abdm.link_abha(patient_id)
        
        # Store ABHA on claim
        db["claims"].update_one(
            {"claim_id": claim_id},
            {"$set": {"abha_number": abha_result["abha_number"]}}
        )
        
        # Save workflow state
        save_state(claim_id, ClaimState.REGISTERED)
        
        # Get patient name
        patient = db["patients"].find_one({"patient_id": patient_id}, {"_id": 0})
        patient_name = patient.get("name", "") if patient else ""
        db["claims"].update_one({"claim_id": claim_id}, {"$set": {"patient_name": patient_name}})
        
        return {
            "patient_id": patient_id,
            "claim_id": claim_id,
            "abha_number": abha_result["abha_number"],
            "consent_status": abha_result["consent_status"],
            "state": "REGISTERED"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/patients/{patient_id}/cashless-selection")
def select_cashless(patient_id: str, payload: dict):
    try:
        claim_id = payload.get("claim_id", "")
        cashless_selected = payload.get("cashless_selected", False)
        
        if not claim_id:
            raise HTTPException(status_code=400, detail="claim_id is required")
        
        db["claims"].update_one(
            {"claim_id": claim_id},
            {"$set": {"cashless_selected": cashless_selected, "updated_at": datetime.utcnow()}}
        )
        
        if cashless_selected:
            transition_state(claim_id, "CASHLESS_SELECTED", "system", "Patient opted for cashless")
            save_state(claim_id, ClaimState.CASHLESS_SELECTED)
            write_audit_event(claim_id, "system", "CASHLESS_SELECTED")
            return {"patient_id": patient_id, "cashless_selected": True, "claim_id": claim_id, "state": "CASHLESS_SELECTED"}
        else:
            transition_state(claim_id, "COMPLETED", "system", "Patient opted out of cashless")
            save_state(claim_id, "COMPLETED")
            return {"patient_id": patient_id, "cashless_selected": False, "claim_id": claim_id, "state": "COMPLETED", "message": "Patient chose regular billing"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/insurance-info")
def capture_insurance_info(claim_id: str, info: dict):
    try:
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Store insurance details on the claim
        update_fields = {
            "insurer_name": info.get("insurer_name", ""),
            "policy_number": info.get("policy_number", ""),
            "member_id": info.get("member_id", ""),
            "policy_type": info.get("policy_type", "individual"),
            "updated_at": datetime.utcnow()
        }
        db["claims"].update_one({"claim_id": claim_id}, {"$set": update_fields})
        
        # Also store in insurance_policies_v2
        db["insurance_policies_v2"].update_one(
            {"patient_id": claim.get("patient_id")},
            {"$set": {
                "patient_id": claim.get("patient_id"),
                "insurer_name": info.get("insurer_name", ""),
                "policy_number": info.get("policy_number", ""),
                "member_id": info.get("member_id", ""),
                "policy_type": info.get("policy_type", "individual"),
                "created_at": datetime.utcnow()
            }},
            upsert=True
        )
        
        transition_state(claim_id, "INSURANCE_CAPTURED", "system", f"Insurance: {info.get('insurer_name')}")
        save_state(claim_id, ClaimState.INSURANCE_CAPTURED)
        write_audit_event(claim_id, "system", "INSURANCE_CAPTURED", metadata=update_fields)
        
        return {"claim_id": claim_id, "insurer_name": info.get("insurer_name"), "policy_type": info.get("policy_type"), "state": "INSURANCE_CAPTURED"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.get("/claims/{claim_id}/tieup-status")
def get_tieup_status(claim_id: str):
    try:
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        insurer_name = claim.get("insurer_name", "")
        if not insurer_name:
            return {"claim_id": claim_id, "insurer_name": "", "tied_up": False, "error": "No insurer set on claim"}
        
        # Actually query insurer directory
        insurer = db["insurer_directory"].find_one({"name": insurer_name}, {"_id": 0})
        tied_up = insurer.get("tied_up", False) if insurer else False
        
        new_state = "TIE_UP_CONFIRMED" if tied_up else "INSURER_NOT_TIED_UP"
        transition_state(claim_id, new_state, "system", f"Insurer {insurer_name}: {'tied up' if tied_up else 'not tied up'}")
        save_state(claim_id, new_state)
        
        if tied_up:
            transition_state(claim_id, "DOCUMENTS_COLLECTED", "system", "Ready for document collection")
            save_state(claim_id, ClaimState.DOCUMENTS_COLLECTED)
            new_state = "DOCUMENTS_COLLECTED"
            
        write_audit_event(claim_id, "system", "TIEUP_CONFIRMED" if tied_up else "INSURER_VERIFIED",
                          metadata={"insurer": insurer_name, "tied_up": tied_up})
        
        return {
            "claim_id": claim_id,
            "insurer_name": insurer_name,
            "tied_up": tied_up,
            "insurer_details": insurer,
            "verified_at": datetime.utcnow().isoformat(),
            "state": new_state
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/submit-for-review")
def submit_for_review(claim_id: str):
    try:
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        # Set bill_amount from the patient's actual billing data
        patient_id = claim.get("patient_id", "")
        patient = db["patients"].find_one({"patient_id": patient_id}, {"_id": 0})
        bill_amount = 0
        if patient:
            # Try to get from patient's billing data
            bill_amount = patient.get("bill_amount", 0) or patient.get("total_charges", 0)
            if not bill_amount:
                # Estimate from daily rate * days
                daily_rate = patient.get("daily_rate", 15000)
                days = patient.get("days_admitted", 5)
                bill_amount = daily_rate * days
        if bill_amount == 0:
            bill_amount = 150000  # Default demo amount
        
        db["claims"].update_one({"claim_id": claim_id}, {"$set": {
            "bill_amount": bill_amount,
            "updated_at": datetime.utcnow()
        }})
        
        # Transition through intermediate states
        transition_state(claim_id, "POLICY_ANALYZED", "system", "Policy auto-analyzed")
        save_state(claim_id, ClaimState.POLICY_ANALYZED)
        
        transition_state(claim_id, "CLAIM_PREPARED", "system", "Claim prepared for review")
        save_state(claim_id, ClaimState.CLAIM_PREPARED)
        
        transition_state(claim_id, "WAITING_FOR_HUMAN_APPROVAL", "system", "Awaiting HITL review")
        save_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL)
        
        write_audit_event(claim_id, "system", "CLAIM_PREPARED", metadata={"bill_amount": bill_amount})
        
        return {"claim_id": claim_id, "state": "WAITING_FOR_HUMAN_APPROVAL", "bill_amount": bill_amount}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/documents")
def upload_document(
    claim_id: str,
    file: UploadFile = File(...),
    doc_type: str = Form("insurance_card")
):
    try:
        # Make sure claim exists
        claim = get_claim(claim_id)

        if not claim:
            raise HTTPException(
                status_code=404,
                detail="Claim not found"
            )

        contents = file.file.read()

        # Run OCR
        from insurance.ocr.document_parser import extract_fields

        ocr_result = extract_fields(contents, doc_type)

        import uuid

        doc_id = str(uuid.uuid4())[:8]

        doc_record = {
            "document_id": doc_id,
            "claim_id": claim_id,
            "doc_type": doc_type,
            "filename": file.filename,
            "ocr_extracted_fields": ocr_result.get(
                "extracted_fields", {}
            ),
            "ocr_confidence": ocr_result.get(
                "confidence", 0
            ),
            "status": "collected",
            "uploaded_at": datetime.utcnow()
        }

        db["insurance_documents"].insert_one(doc_record)

        write_audit_event(
            claim_id,
            "system",
            "DOCUMENT_UPLOADED",
            metadata={
                "doc_type": doc_type,
                "filename": file.filename
            }
        )

        # Required documents
        required = {
            "insurance_card",
            "id_proof",
            "prescription",
            "discharge_summary"
        }

        uploaded = {
            d.get("doc_type")
            for d in db["insurance_documents"].find(
                {"claim_id": claim_id},
                {"_id": 0, "doc_type": 1}
            )
        }

        missing = sorted(required - uploaded)

        # IMPORTANT:
        # Always return a response after upload
        return {
            "document_id": doc_id,
            "doc_type": doc_type,
            "filename": file.filename,
            "ocr_extracted_fields": ocr_result.get(
                "extracted_fields", {}
            ),
            "ocr_confidence": ocr_result.get(
                "confidence", 0
            ),
            "status": "collected",
            "missing_documents": missing,
            "all_documents_uploaded": len(missing) == 0,
            "state": get_claim(claim_id).get("state")
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Document upload error: {e}")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@insurance_router.get("/claims/{claim_id}/missing-documents")
def get_missing_documents(claim_id: str):
    try:
        required = ["insurance_card", "id_proof", "prescription", "discharge_summary"]
        uploaded = list(db["insurance_documents"].find({"claim_id": claim_id}, {"_id": 0, "doc_type": 1}))
        uploaded_types = [d.get("doc_type") for d in uploaded]
        missing = [t for t in required if t not in uploaded_types]
        return {"claim_id": claim_id, "missing": missing, "uploaded": uploaded_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/policy/ask")
def ask_policy_question(claim_id: str, payload: dict):
    try:
        question = payload.get("question", "")
        if not question:
            raise HTTPException(status_code=400, detail="question is required")
        
        try:
            from insurance.rag.policy_rag import ask_policy as rag_ask
            result = rag_ask(claim_id, question)
            return {"claim_id": claim_id, "answer": result.get("answer", ""), "source_chunks": result.get("source_chunks", [])}
        except Exception as rag_err:
            print(f"RAG error: {rag_err}")
            return {"claim_id": claim_id, "answer": f"Policy RAG unavailable: {str(rag_err)}", "source_chunks": []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# HITL Review
@insurance_router.get("/claims/{claim_id}/review")
def get_claim_review(claim_id: str):
    try:
        payload = get_review_payload(claim_id)
        if not payload:
            raise HTTPException(status_code=404, detail="Claim not found")
        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ReviewDecision(BaseModel):
    action: str
    notes: Optional[str] = ""
    edited_fields: Optional[Dict[str, Any]] = None
    reviewer: Optional[str] = "Staff"


@insurance_router.post("/claims/{claim_id}/review")
def submit_review(claim_id: str, decision: ReviewDecision):
    try:
        action = decision.action.upper()
        
        # Store review record
        db["human_reviews"].insert_one({
            "claim_id": claim_id,
            "action": action,
            "notes": decision.notes,
            "reviewer": decision.reviewer,
            "edited_fields": decision.edited_fields,
            "created_at": datetime.utcnow()
        })
        
        result = workflow.resume_after_review(
            claim_id, action.lower(), decision.notes, decision.edited_fields
        )
        
        claim = get_claim(claim_id)
        return {
            "claim_id": claim_id,
            "state": claim.get("state") if claim else result.get("state"),
            "next_action": result.get("message", "Review processed")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.get("/claims/{claim_id}")
def get_claim_details(claim_id: str):
    try:
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        history = list(db["claim_status_history"].find({"claim_id": claim_id}, {"_id": 0}).sort("timestamp", 1))
        
        return {
            "claim_id": claim_id,
            "state": claim.get("state"),
            "history": history,
            "amounts": {
                "bill_amount": claim.get("bill_amount", 0),
                "approved_amount": claim.get("approved_amount", 0),
                "received_amount": claim.get("received_amount", 0),
            },
            **{k: v for k, v in claim.items() if k not in ["_id"]}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.get("/claims/{claim_id}/audit")
def get_audit_trail(claim_id: str):
    try:
        from insurance.audit import audit_events_collection
        events = list(audit_events_collection.find({"claim_id": claim_id}, {"_id": 0}).sort("timestamp", 1))
        history = list(db["claim_status_history"].find({"claim_id": claim_id}, {"_id": 0}).sort("timestamp", 1))
        return {"claim_id": claim_id, "events": events, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/insurer-response")
def simulate_insurer_response(claim_id: str, payload: dict):
    try:
        outcome = payload.get("outcome", "approved").lower()
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        if outcome == "approved":
            approved_amt = claim.get("bill_amount", 0) * 0.9  # 90% approved for demo
            transition_state(claim_id, "APPROVED", "insurer", "Claim approved by insurer")
            save_state(claim_id, ClaimState.APPROVED)
            calculate_amounts(claim_id, approved_amount=approved_amt)
            transition_state(claim_id, "PAYMENT_PENDING", "system", "Awaiting payment")
            save_state(claim_id, ClaimState.PAYMENT_PENDING)
            write_audit_event(claim_id, "insurer", "CLAIM_APPROVED", metadata={"approved_amount": approved_amt})
            return {"claim_id": claim_id, "state": "PAYMENT_PENDING", "reason": f"Approved. Amount: {approved_amt}"}
        
        elif outcome == "rejected":
            transition_state(claim_id, "REJECTED", "insurer", "Claim rejected")
            save_state(claim_id, ClaimState.REJECTED)
            write_audit_event(claim_id, "insurer", "CLAIM_REJECTED")
            return {"claim_id": claim_id, "state": "REJECTED", "reason": "Rejected by insurer"}
        
        elif outcome == "query_received":
            transition_state(claim_id, "QUERY_RECEIVED", "insurer", "Insurer requested additional info")
            save_state(claim_id, ClaimState.QUERY_RECEIVED)
            write_audit_event(claim_id, "insurer", "QUERY_RECEIVED")
            return {"claim_id": claim_id, "state": "QUERY_RECEIVED", "reason": "Insurer requested more information"}
        
        else:
            raise HTTPException(status_code=400, detail=f"Invalid outcome: {outcome}. Use approved/rejected/query_received")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/claims/{claim_id}/mark-payment-received")
def mark_payment_received(claim_id: str, payload: dict):
    try:
        received_amount = payload.get("received_amount", 0)
        reference_number = payload.get("reference_number", "")
        
        claim = get_claim(claim_id)
        if not claim:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        calculate_amounts(claim_id, received_amount=received_amount)
        
        # Store payment record
        db["payment_transactions"].insert_one({
            "claim_id": claim_id,
            "received_amount": received_amount,
            "reference_number": reference_number,
            "received_at": datetime.utcnow(),
            "reconciled": True
        })
        
        transition_state(claim_id, "PAYMENT_RECEIVED", "accounts", f"Payment received: {received_amount}")
        save_state(claim_id, ClaimState.PAYMENT_RECEIVED)
        write_audit_event(claim_id, "accounts", "PAYMENT_RECEIVED", metadata={"amount": received_amount, "reference": reference_number})
        
        # Auto-complete
        transition_state(claim_id, "COMPLETED", "system", "Claim finalized")
        save_state(claim_id, ClaimState.COMPLETED)
        write_audit_event(claim_id, "system", "CLAIM_COMPLETED")
        
        return {"claim_id": claim_id, "received_amount": received_amount, "reference_number": reference_number, "state": "COMPLETED"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.get("/insurer-directory")
def get_insurer_directory():
    try:
        return {"insurers": list(db["insurer_directory"].find({}, {"_id": 0}))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@insurance_router.post("/insurer-directory")
def add_to_insurer_directory(insurer: dict):
    try:
        insurer["created_at"] = datetime.utcnow()
        db["insurer_directory"].update_one(
            {"name": insurer.get("name")},
            {"$set": insurer},
            upsert=True
        )
        return {"status": "added", "name": insurer.get("name")}
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


@insurance_router.post("/claims/{claim_id}/analyze-policy")
def analyze_policy(claim_id: str):
    from insurance.rag.policy_rag import ask_policy as rag_ask
    findings = rag_ask(claim_id, "Summarize coverage, co-pay, room rent limit, and exclusions.")
    db["claims"].update_one({"claim_id": claim_id},
                            {"$set": {"policy_findings": findings.get("answer", "")}})
    transition_state(claim_id, "POLICY_ANALYZED", "system", "Policy analyzed")
    save_state(claim_id, ClaimState.POLICY_ANALYZED)
    write_audit_event(claim_id, "system", "POLICY_ANALYZED")
    return {"claim_id": claim_id, "state": "POLICY_ANALYZED", "findings": findings.get("answer", "")}

@insurance_router.post("/claims/{claim_id}/prepare")
def prepare_claim_endpoint(claim_id: str):
    from insurance.workflow.nodes import prepare_claim
    result = prepare_claim({"claim_id": claim_id})
    return {"claim_id": claim_id, "state": "WAITING_FOR_HUMAN_APPROVAL"}


@insurance_router.patch("/claims/{claim_id}/documents/{document_id}")
def confirm_document_fields(claim_id: str, document_id: str, payload: dict):
    try:
        fields = payload.get("fields", {})

        result = db["insurance_documents"].update_one(
            {"claim_id": claim_id, "document_id": document_id},
            {"$set": {
                "ocr_extracted_fields": fields,
                "status": "verified",
                "verified_at": datetime.utcnow(),
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")

        doc = db["insurance_documents"].find_one({"document_id": document_id}, {"_id": 0})

        # Verified insurance card data becomes the claim's policy data
        if doc.get("doc_type") == "insurance_card":
            mapping = {"policy_number": "policy_number",
                       "member_id": "member_id",
                       "insurer": "insurer_name"}
            claim_update = {dest: fields[src] for src, dest in mapping.items() if fields.get(src)}
            if claim_update:
                claim_update["updated_at"] = datetime.utcnow()
                db["claims"].update_one({"claim_id": claim_id}, {"$set": claim_update})

        write_audit_event(claim_id, "staff", "DOCUMENT_RECEIVED",
                          metadata={"document_id": document_id,
                                    "doc_type": doc.get("doc_type"),
                                    "fields": fields})

        required = {"insurance_card", "id_proof", "prescription", "discharge_summary"}
        verified = {d["doc_type"] for d in db["insurance_documents"].find(
            {"claim_id": claim_id, "status": "verified"}, {"_id": 0, "doc_type": 1})}
        missing = sorted(required - verified)

        claim = get_claim(claim_id)
        if not missing and claim.get("state") == "TIE_UP_CONFIRMED":
            transition_state(
                claim_id,
                "DOCUMENTS_COLLECTED",
                "staff",
                "All required documents verified"
            )

            save_state(
                claim_id,
                ClaimState.DOCUMENTS_COLLECTED
            )

            # Continue the workflow automatically
            workflow_result = workflow.advance(claim_id)

        else:
            workflow_result = None

        return {
            "document_id": document_id,
            "status": "verified",
            "missing_documents": missing,
            "state": get_claim(claim_id).get("state"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@insurance_router.post("/claims/{claim_id}/advance")
def advance_claim(claim_id: str):
    try:
        claim = get_claim(claim_id)

        if not claim:
            raise HTTPException(
                status_code=404,
                detail="Claim not found"
            )

        result = workflow.advance(claim_id)

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )