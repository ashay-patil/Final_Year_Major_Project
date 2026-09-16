def extract_fields(file_bytes, doc_type):
    """Mock OCR — returns demo-extracted fields for staff to review/correct."""
    mock_fields = {
        "insurance_card": {"policy_number": "POL-DEMO-12345", "member_id": "MEM-67890", "insurer": "Star Health", "valid_till": "2027-12-31"},
        "id_proof": {"name": "Demo Patient", "id_number": "XXXX-XXXX-1234", "id_type": "Aadhaar"},
        "prescription": {"doctor": "Dr. Demo", "medications": "As per treatment", "date": "2026-09-15"},
        "discharge_summary": {"diagnosis": "Demo Diagnosis", "treatment": "Demo Treatment", "outcome": "Recovered"},
    }
    return {
        "extracted_fields": mock_fields.get(doc_type, {"raw_text": "Document content extracted"}),
        "confidence": 0.85,
        "doc_type": doc_type,
        "needs_review": True
    }
