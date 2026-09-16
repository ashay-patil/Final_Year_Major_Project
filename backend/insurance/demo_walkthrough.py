import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from insurance.workflow.graph import InsuranceWorkflow
from insurance.workflow.states import ClaimState
from insurance.workflow.persistence import save_state
from insurance.claim_service import create_claim

if __name__ == "__main__":
    print("Starting Demo Walkthrough...")
    
    # Register patient
    claim_id = create_claim("PAT001")
    print(f"Created claim: {claim_id}")
    
    # Link ABHA, Select cashless, Capture insurance, Check tie-up, Upload documents, Prepare claim
    wf = InsuranceWorkflow()
    save_state(claim_id, ClaimState.REGISTERED)
    
    print("Advancing workflow...")
    result = wf.advance(claim_id)
    
    print(f"Workflow paused at state: {result.get('state')}")
    if result.get("pause") and result.get("state") == ClaimState.WAITING_FOR_HUMAN_APPROVAL:
        print("Demo claim ready for HITL review!")
    else:
        print("Workflow did not reach expected pause state.")
