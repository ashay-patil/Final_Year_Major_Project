from abc import ABC, abstractmethod

class SMSAdapter(ABC):
    @abstractmethod
    def send(self, phone, message): ...

class MockSMSAdapter(SMSAdapter):
    def send(self, phone, message):
        from backend.database import db
        db["notifications"].insert_one({
            "type": "sms",
            "phone": phone,
            "message": message,
            "status": "sent_mock"
        })
        return True
