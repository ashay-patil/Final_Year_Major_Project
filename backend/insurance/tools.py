from langchain.tools import tool
from backend.insurance import claim_service

@tool
def get_claim_status(claim_id: str) -> str:
    """Get the current status of a claim"""
    claim = claim_service.get_claim(claim_id)
    if not claim:
        return "Claim not found"
    return f"Claim status: {claim.get('state')}"

@tool
def approve_claim(claim_id: str, actor: str) -> str:
    """Approve a claim (transition from WAITING_FOR_HUMAN_APPROVAL)"""
    claim_service.transition_state(claim_id, "CLAIM_APPROVED", actor, "Approved via tool")
    return "Claim approved"
