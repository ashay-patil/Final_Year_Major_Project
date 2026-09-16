from .states import ClaimState
from . import nodes
from .persistence import save_state, load_state
from insurance.claim_service import transition_state
from insurance.audit import write_audit_event

class InsuranceWorkflow:
    """Manages the claim workflow state machine."""
    
    # Define which function handles each state transition
    STATE_HANDLERS = {
        ClaimState.REGISTERED: nodes.link_abha,
        ClaimState.CASHLESS_SELECTED: nodes.capture_insurance,
        ClaimState.INSURANCE_CAPTURED: nodes.check_insurer_tieup,
        ClaimState.TIE_UP_CONFIRMED: nodes.collect_documents,
        ClaimState.DOCUMENTS_COLLECTED: nodes.analyze_policy,
        ClaimState.POLICY_ANALYZED: nodes.prepare_claim,
        ClaimState.CLAIM_PREPARED: nodes.human_review,  # should auto transition to WAITING_FOR_HUMAN_APPROVAL in prepare_claim
        ClaimState.WAITING_FOR_HUMAN_APPROVAL: nodes.human_review,
        ClaimState.CLAIM_SUBMITTED: nodes.monitor_claim,
    }
    
    def advance(self, claim_id, **kwargs):
        """Advance the claim to the next state. Returns when hitting a pause point (HITL)."""
        state_doc = load_state(claim_id)
        if not state_doc:
            return {"claim_id": claim_id, "error": "State not found"}
            
        current = ClaimState(state_doc["current_state"])
        
        # Execute handler for current state
        handler = self.STATE_HANDLERS.get(current)
        if handler:
            result = handler({"claim_id": claim_id, **kwargs})
            # Check if we hit a pause point
            if result.get("pause"):
                return result
            # Auto-advance if possible
            return self.advance(claim_id, **kwargs)
        return {"claim_id": claim_id, "state": current, "message": "No handler for state or terminal state reached"}
    
    def resume_after_review(self, claim_id, action, notes="", edited_fields=None):
        """Resume workflow after HITL review."""
        if action == "approve":
            transition_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL, ClaimState.CLAIM_SUBMITTED)
            write_audit_event(claim_id, "Reviewer", f"Approved claim. Notes: {notes}", "Success", edited_fields or {})
            save_state(claim_id, ClaimState.CLAIM_SUBMITTED)
            return self.advance(claim_id)
        elif action == "reject":
            transition_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL, ClaimState.REJECTED)
            write_audit_event(claim_id, "Reviewer", f"Rejected claim. Notes: {notes}", "Failed", {})
            save_state(claim_id, ClaimState.REJECTED)
            return {"claim_id": claim_id, "state": ClaimState.REJECTED}
        elif action == "query":
            transition_state(claim_id, ClaimState.WAITING_FOR_HUMAN_APPROVAL, ClaimState.ADDITIONAL_INFORMATION_REQUIRED)
            write_audit_event(claim_id, "Reviewer", f"Requested additional info. Notes: {notes}", "Pending", {})
            save_state(claim_id, ClaimState.ADDITIONAL_INFORMATION_REQUIRED)
            return {"claim_id": claim_id, "state": ClaimState.ADDITIONAL_INFORMATION_REQUIRED}
        
        return {"claim_id": claim_id, "error": "Invalid action"}
