from datetime import datetime
from database import db

audit_events_collection = db["insurance_audit_events"]

AUDIT_EVENTS = [
    "PATIENT_REGISTERED", "ABHA_LINKED", "CASHLESS_SELECTED", "INSURANCE_CAPTURED",
    "INSURER_VERIFIED", "TIEUP_CONFIRMED", "DOCUMENT_UPLOADED", "POLICY_ANALYZED",
    "CLAIM_PREPARED", "HUMAN_APPROVED", "CLAIM_SUBMITTED", "CLAIM_ACKNOWLEDGED",
    "QUERY_RECEIVED", "DOCUMENT_REQUESTED", "DOCUMENT_RECEIVED", "CLAIM_RESUBMITTED",
    "CLAIM_REJECTED", "CLAIM_APPROVED", "PAYMENT_RECEIVED", "PAYMENT_RECONCILED", "CLAIM_COMPLETED"
]

def write_audit_event(claim_id, actor, event, status="success", metadata=None):
    record = {
        "claim_id": claim_id,
        "timestamp": datetime.utcnow(),
        "actor": actor,
        "event": event,
        "status": status,
        "metadata": metadata or {}
    }
    audit_events_collection.insert_one(record)
    return record
