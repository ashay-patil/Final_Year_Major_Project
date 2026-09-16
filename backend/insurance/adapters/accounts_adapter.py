from abc import ABC, abstractmethod

class HospitalAccountsAdapter(ABC):
    @abstractmethod
    def get_expected_amount(self, claim_id): ...
    @abstractmethod
    def get_received_amount(self, claim_id): ...
    @abstractmethod
    def mark_payment_received(self, claim_id, amount, reference): ...

class MockHospitalAccountsAdapter(HospitalAccountsAdapter):
    def get_expected_amount(self, claim_id):
        return 0
        
    def get_received_amount(self, claim_id):
        return 0
        
    def mark_payment_received(self, claim_id, amount, reference):
        from backend.database import db
        db["payment_transactions"].insert_one({
            "claim_id": claim_id,
            "amount": amount,
            "reference": reference
        })
        return True
