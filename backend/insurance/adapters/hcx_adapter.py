import uuid

class HCXAdapter:
    def validate(self, claim):
        errors = []
        required_fields = ["policy_number", "member_id", "bill_amount", "patient_id"]
        for field in required_fields:
            if field not in claim or not claim[field]:
                errors.append(f"Missing required field: {field}")
        
        return {"valid": len(errors) == 0, "errors": errors}
        
    def send(self, claim, mock_outcome="approved"):
        transaction_id = str(uuid.uuid4())
        return {
            "transaction_id": transaction_id,
            "status": "success",
            "response": {
                "outcome": mock_outcome,
                "message": f"Claim {mock_outcome}"
            }
        }
        
    def parse_response(self, raw):
        return {
            "status": raw.get("response", {}).get("outcome", "unknown"),
            "reason": raw.get("response", {}).get("message", ""),
            "approved_amount": raw.get("approved_amount", 0)
        }

class MockHCXAdapter(HCXAdapter):
    pass
