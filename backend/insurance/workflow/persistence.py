from datetime import datetime
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from database import db

workflow_states = db["workflow_states"]

def save_state(claim_id, current_state, pending_action=None, checkpoint=None):
    workflow_states.update_one(
        {"claim_id": claim_id},
        {"$set": {
            "claim_id": claim_id,
            "current_state": current_state,
            "pending_action": pending_action,
            "graph_checkpoint": checkpoint,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )

def load_state(claim_id):
    return workflow_states.find_one({"claim_id": claim_id}, {"_id": 0})
