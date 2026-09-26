from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class InsuranceInfoRequest(BaseModel):
    patient_id: str
    policy_number: str
    insurer: str
    member_id: Optional[str] = None

class ReviewRequest(BaseModel):
    claim_id: str
    approved: bool
    comments: Optional[str] = None

class InsurerResponseRequest(BaseModel):
    claim_id: str
    status: str
    reason: Optional[str] = None
    approved_amount: Optional[float] = 0

class PaymentReceivedRequest(BaseModel):
    claim_id: str
    amount: float
    reference: str
