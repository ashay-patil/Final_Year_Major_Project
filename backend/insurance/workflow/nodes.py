import os
from .states import ClaimState
from .persistence import save_state
from insurance.claim_service import transition_state
from insurance.audit import write_audit_event
from groq import Groq

# Initialize Groq client securely
client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

def initialize_claim(state):
    claim_id = state["claim_id"]
    save_state(claim_id, ClaimState.REGISTERED)
    return {"claim_id": claim_id, "state": ClaimState.REGISTERED}

def link_abha(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.REGISTERED, ClaimState.CASHLESS_SELECTED)
    write_audit_event(claim_id, "System", "ABHA linked and cashless selected", "Success", {})
    save_state(claim_id, ClaimState.CASHLESS_SELECTED)
    return {"claim_id": claim_id, "state": ClaimState.CASHLESS_SELECTED}

def capture_insurance(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.CASHLESS_SELECTED, ClaimState.INSURANCE_CAPTURED)
    write_audit_event(claim_id, "System", "Insurance details captured", "Success", {})
    save_state(claim_id, ClaimState.INSURANCE_CAPTURED)
    return {"claim_id": claim_id, "state": ClaimState.INSURANCE_CAPTURED}

def check_insurer_tieup(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.INSURANCE_CAPTURED, ClaimState.TIE_UP_CONFIRMED)
    write_audit_event(claim_id, "System", "Insurer tie-up confirmed", "Success", {})
    save_state(claim_id, ClaimState.TIE_UP_CONFIRMED)
    return {"claim_id": claim_id, "state": ClaimState.TIE_UP_CONFIRMED}

def collect_documents(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.TIE_UP_CONFIRMED, ClaimState.DOCUMENTS_COLLECTED)
    write_audit_event(claim_id, "System", "Documents collected", "Success", {})
    save_state(claim_id, ClaimState.DOCUMENTS_COLLECTED)
    return {"claim_id": claim_id, "state": ClaimState.DOCUMENTS_COLLECTED}

def analyze_policy(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.DOCUMENTS_COLLECTED, ClaimState.POLICY_ANALYZED)
    write_audit_event(claim_id, "System", "Policy analyzed", "Success", {})
    save_state(claim_id, ClaimState.POLICY_ANALYZED)
    return {"claim_id": claim_id, "state": ClaimState.POLICY_ANALYZED}

def prepare_claim(state):
    claim_id = state["claim_id"]
    draft = ""
    try:
        # LLM only drafts cover letter with timeout
        prompt = f"Draft a short, professional cover letter for medical insurance claim ID {claim_id}."
        completion = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            timeout=15.0
        )
        if completion.choices:
            draft = completion.choices[0].message.content
    except Exception as e:
        draft = f"Error drafting cover letter: {e}"

    transition_state(claim_id, ClaimState.POLICY_ANALYZED, ClaimState.CLAIM_PREPARED)
    write_audit_event(claim_id, "System", "Claim prepared", "Success", {"draft": draft})
    
    # Auto transition to WAITING_FOR_HUMAN_APPROVAL
    transition_state(claim_id, ClaimState.CLAIM_PREPARED, ClaimState.WAITING_FOR_HUMAN_APPROVAL)
    write_audit_event(claim_id, "System", "Awaiting human review", "Pending", {})
    save_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL)
    
    return {"claim_id": claim_id, "state": ClaimState.WAITING_FOR_HUMAN_APPROVAL, "pause": True}

def human_review(state):
    claim_id = state["claim_id"]
    # PAUSES the workflow - returns pause: True
    save_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL)
    return {"claim_id": claim_id, "state": ClaimState.WAITING_FOR_HUMAN_APPROVAL, "pause": True}

def submit_claim(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL, ClaimState.CLAIM_SUBMITTED)
    write_audit_event(claim_id, "System", "Claim submitted to insurer", "Success", {})
    save_state(claim_id, ClaimState.CLAIM_SUBMITTED)
    return {"claim_id": claim_id, "state": ClaimState.CLAIM_SUBMITTED}

def monitor_claim(state):
    pass

def handle_approval(state):
    claim_id = state["claim_id"]
    # Transition to APPROVED
    save_state(claim_id, ClaimState.APPROVED)
    return {"claim_id": claim_id, "state": ClaimState.APPROVED}

def handle_query(state):
    claim_id = state["claim_id"]
    save_state(claim_id, ClaimState.QUERY_RECEIVED)
    return {"claim_id": claim_id, "state": ClaimState.QUERY_RECEIVED}

def handle_rejection(state):
    claim_id = state["claim_id"]
    save_state(claim_id, ClaimState.REJECTED)
    return {"claim_id": claim_id, "state": ClaimState.REJECTED}

def monitor_payment(state):
    claim_id = state["claim_id"]
    save_state(claim_id, ClaimState.PAYMENT_PENDING)
    return {"claim_id": claim_id, "state": ClaimState.PAYMENT_PENDING}

def finalize_claim(state):
    claim_id = state["claim_id"]
    transition_state(claim_id, ClaimState.PAYMENT_RECEIVED, ClaimState.COMPLETED)
    write_audit_event(claim_id, "System", "Claim finalized and completed", "Success", {})
    save_state(claim_id, ClaimState.COMPLETED)
    return {"claim_id": claim_id, "state": ClaimState.COMPLETED}
