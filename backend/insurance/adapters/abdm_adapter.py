from abc import ABC, abstractmethod
import uuid, random, string
from datetime import datetime

class ABDMAdapter(ABC):
    @abstractmethod
    def link_abha(self, patient_id, abha_number=None): ...

class MockABDMAdapter(ABDMAdapter):
    def link_abha(self, patient_id, abha_number=None):
        if not abha_number:
            digits = ''.join(random.choices(string.digits, k=14))
            abha_number = f"SANDBOX-{digits[:2]}-{digits[2:6]}-{digits[6:10]}-{digits[10:14]}"
        return {
            "patient_id": patient_id,
            "abha_number": abha_number,
            "consent_status": "auto_granted",
            "linked_at": datetime.utcnow().isoformat(),
            "source": "mock_abdm"
        }
