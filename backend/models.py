from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional

class VitalSigns(BaseModel):
    blood_pressure: str
    heart_rate: int
    temperature: float
    respiratory_rate: int
    oxygen_saturation: int

class Patient(BaseModel):
    patient_id: str
    name: str
    age: int
    diagnosis: str
    admission_date: str
    vital_signs: VitalSigns
    treatment_status: str
    ready_for_discharge: bool = False

class PatientUpdate(BaseModel):
    vital_signs: Optional[VitalSigns] = None
    treatment_status: Optional[str] = None

class DischargeLog(BaseModel):
    patient_id: str
    action: str
    details: str
    agent: str
    timestamp: datetime
