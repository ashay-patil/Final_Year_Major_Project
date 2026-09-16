from .states import ClaimState
from . import nodes
from .persistence import save_state, load_state
from insurance.claim_service import transition_state
from insurance.audit import write_audit_event
from database import db

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
        if action in ("approve", "APPROVE"):
            transition_state(claim_id, "CLAIM_SUBMITTED", "reviewer", f"Approved. {notes}")
            save_state(claim_id, ClaimState.CLAIM_SUBMITTED)
            write_audit_event(claim_id, "reviewer", "HUMAN_APPROVED", metadata={"notes": notes})
            
            # Simulate HCX submission
            from insurance.adapters import get_hcx_adapter
            hcx = get_hcx_adapter()
            claim = db["claims"].find_one({"claim_id": claim_id}, {"_id": 0})
            validation = hcx.validate(claim or {})
            if validation.get("valid"):
                send_result = hcx.send(claim or {})
                write_audit_event(claim_id, "system", "CLAIM_SUBMITTED", metadata=send_result)
            
            transition_state(claim_id, "PENDING", "system", "Submitted to insurer, awaiting response")
            save_state(claim_id, ClaimState.PENDING)
            
            return {"claim_id": claim_id, "state": "PENDING", "message": "Claim submitted to insurer"}
        
        elif action in ("reject", "REJECT"):
            transition_state(claim_id, "REJECTED", "reviewer", f"Rejected. {notes}")
            save_state(claim_id, ClaimState.REJECTED)
            write_audit_event(claim_id, "reviewer", "CLAIM_REJECTED", metadata={"notes": notes})
            return {"claim_id": claim_id, "state": "REJECTED", "message": "Claim rejected by reviewer"}
        
        elif action in ("request_information", "REQUEST_INFORMATION"):
            transition_state(claim_id, "ADDITIONAL_INFORMATION_REQUIRED", "reviewer", f"Info requested. {notes}")
            save_state(claim_id, ClaimState.ADDITIONAL_INFORMATION_REQUIRED)
            write_audit_event(claim_id, "reviewer", "DOCUMENT_REQUESTED", metadata={"notes": notes})
            return {"claim_id": claim_id, "state": "ADDITIONAL_INFORMATION_REQUIRED", "message": "Additional info requested"}
        
        elif action in ("edit", "EDIT"):
            # Apply edits and keep at WAITING_FOR_HUMAN_APPROVAL for re-review
            if edited_fields:
                db["claims"].update_one({"claim_id": claim_id}, {"$set": edited_fields})
            return {"claim_id": claim_id, "state": "WAITING_FOR_HUMAN_APPROVAL", "message": "Edits applied, re-review required"}
        
        return {"claim_id": claim_id, "error": f"Invalid action: {action}"}
