from abc import ABC, abstractmethod

class CommunicationAdapter(ABC):
    @abstractmethod
    def send_claim_package(self, claim, recipient, attachments=None): ...
