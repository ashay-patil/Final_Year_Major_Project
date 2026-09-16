import os

def get_abdm_adapter():
    from .abdm_adapter import MockABDMAdapter
    return MockABDMAdapter()

def get_hcx_adapter():
    from .hcx_adapter import MockHCXAdapter
    return MockHCXAdapter()

def get_communication_adapter():
    from .email_adapter import MockEmailAdapter
    return MockEmailAdapter()

def get_sms_adapter():
    from .sms_adapter import MockSMSAdapter
    return MockSMSAdapter()

def get_accounts_adapter():
    from .accounts_adapter import MockHospitalAccountsAdapter
    return MockHospitalAccountsAdapter()
