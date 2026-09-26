from .communication_adapter import CommunicationAdapter
from backend.email_service import send_email

class EmailAdapter(CommunicationAdapter):
    def send_claim_package(self, claim, recipient, attachments=None):
        pass # Wrap existing send_email

class MockEmailAdapter(CommunicationAdapter):
    def send_claim_package(self, claim, recipient, attachments=None):
        from backend.database import db
        db["notifications"].insert_one({
            "type": "email",
            "claim_id": claim.get("claim_id"),
            "recipient": recipient,
            "status": "sent_mock"
        })
        return True
