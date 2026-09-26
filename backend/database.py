from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DATABASE_NAME = "mediflow_ai_insurence"

# Nurse email for notifications
NURSE_EMAIL = os.getenv("NURSE_EMAIL", "nurse@stjudes.com")

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
patients_collection = db["patients"]
discharge_logs_collection = db["discharge_logs"]
nurse_tasks_collection = db["nurse_tasks"]

# Insurance Claim Automation Collections
abha_profiles = db["abha_profiles"]
insurance_policies_v2 = db["insurance_policies_v2"]
insurer_directory = db["insurer_directory"]
hospital_insurer_tieups = db["hospital_insurer_tieups"]
insurance_documents = db["insurance_documents"]
claims_collection = db["claims"]
claim_documents = db["claim_documents"]
claim_messages = db["claim_messages"]
claim_status_history = db["claim_status_history"]
hcx_transactions = db["hcx_transactions"]
human_reviews = db["human_reviews"]
payment_transactions = db["payment_transactions"]
notifications_collection = db["notifications"]
workflow_states = db["workflow_states"]
def get_database():
    return db

def get_nurse_email():
    return NURSE_EMAIL

def init_insurer_directory():
    """Ensure all insurance companies are tied up by default and available in insurer_directory."""
    default_insurers = [
        {
            "name": "Star Health",
            "full_name": "Star Health Insurance",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@starhealth.demo",
            "network_hospitals": 12000,
            "verification_status": "verified",
            "hcx_participant_code": "STAR-HCX-001",
            "plan_name": "Family Health Optima",
            "bill_concession_percent": 70,
            "copay_percent": 10,
            "max_coverage": 500000
        },
        {
            "name": "HDFC ERGO",
            "full_name": "HDFC ERGO Health",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@hdfcergo.demo",
            "network_hospitals": 13000,
            "verification_status": "verified",
            "hcx_participant_code": "HDFC-HCX-002",
            "plan_name": "Optima Secure",
            "bill_concession_percent": 65,
            "copay_percent": 5,
            "max_coverage": 750000
        },
        {
            "name": "Niva Bupa",
            "full_name": "Niva Bupa (Max Bupa)",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@nivabupa.demo",
            "network_hospitals": 10000,
            "verification_status": "verified",
            "hcx_participant_code": "NIVA-HCX-003",
            "plan_name": "Health Recharge",
            "bill_concession_percent": 60,
            "copay_percent": 15,
            "max_coverage": 1000000
        },
        {
            "name": "ICICI Lombard",
            "full_name": "ICICI Lombard",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@icicilombard.demo",
            "network_hospitals": 8500,
            "verification_status": "verified",
            "hcx_participant_code": "ICICI-HCX-004",
            "plan_name": "Health AdvantEdge",
            "bill_concession_percent": 55,
            "copay_percent": 20,
            "max_coverage": 500000
        },
        {
            "name": "Bajaj Allianz",
            "full_name": "Bajaj Allianz",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@bajaj.demo",
            "network_hospitals": 9000,
            "verification_status": "verified",
            "hcx_participant_code": "BAJAJ-HCX-005",
            "plan_name": "Health Guard Gold",
            "bill_concession_percent": 50,
            "copay_percent": 15,
            "max_coverage": 400000
        },
        {
            "name": "Ayushman Bharat",
            "full_name": "Ayushman Bharat (PMJAY)",
            "tied_up": True,
            "type": "cashless",
            "claim_channel": "HCX",
            "channel": "HCX",
            "claim_email": "claims@pmjay.demo",
            "network_hospitals": 25000,
            "verification_status": "verified",
            "hcx_participant_code": "PMJAY-HCX-006",
            "plan_name": "Government Scheme",
            "bill_concession_percent": 100,
            "copay_percent": 0,
            "max_coverage": 500000
        }
    ]
    for ins in default_insurers:
        db["insurer_directory"].update_one(
            {"name": ins["name"]},
            {"$set": ins},
            upsert=True
        )
    # Ensure every insurer in the directory has tied_up=True
    db["insurer_directory"].update_many({}, {"$set": {"tied_up": True, "type": "cashless", "verification_status": "verified"}})

# Run insurer directory initialization on import
try:
    init_insurer_directory()
except Exception as _e:
    print(f"Insurer directory init warning: {_e}")

# Sample data initialization
def init_sample_data():
    init_insurer_directory()
    if patients_collection.count_documents({}) == 0:
        sample_patients = [
            {
                "patient_id": "PAT001",
                "name": "John Smith",
                "age": 45,
                "diagnosis": "Acute Myocardial Infarction",
                "admission_date": "2025-09-20",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "120/80",
                    "heart_rate": 75,
                    "temperature": 98.6,
                    "respiratory_rate": 16,
                    "oxygen_saturation": 98
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/men/1.jpg"
            },
            {
                "patient_id": "PAT002",
                "name": "Emma Johnson",
                "age": 28,
                "diagnosis": "Acute Appendicitis",
                "admission_date": "2025-09-22",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "110/70",
                    "heart_rate": 80,
                    "temperature": 99.1,
                    "respiratory_rate": 18,
                    "oxygen_saturation": 99
                },
                "treatment_status": "in-progress",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/women/2.jpg"
            },
            {
                "patient_id": "PAT003",
                "name": "Raj Singh",
                "age": 52,
                "diagnosis": "COPD",
                "admission_date": "2025-09-25",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "125/85",
                    "heart_rate": 82,
                    "temperature": 98.9,
                    "respiratory_rate": 20,
                    "oxygen_saturation": 95
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/men/3.jpg"
            },
            {
                "patient_id": "PAT004",
                "name": "Priya Patel",
                "age": 36,
                "diagnosis": "Fractured Femur",
                "admission_date": "2025-09-30",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "115/75",
                    "heart_rate": 72,
                    "temperature": 98.5,
                    "respiratory_rate": 18,
                    "oxygen_saturation": 98
                },
                "treatment_status": "in-progress",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/women/4.jpg"
            },
            {
                "patient_id": "PAT005",
                "name": "Michael Lee",
                "age": 50,
                "diagnosis": "Type 2 Diabetes",
                "admission_date": "2025-10-01",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "135/85",
                    "heart_rate": 76,
                    "temperature": 98.7,
                    "respiratory_rate": 17,
                    "oxygen_saturation": 97
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/men/5.jpg"
            },
            {
                "patient_id": "PAT006",
                "name": "Fatima Noor",
                "age": 22,
                "diagnosis": "Pneumonia",
                "admission_date": "2025-09-19",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "110/68",
                    "heart_rate": 85,
                    "temperature": 99.8,
                    "respiratory_rate": 21,
                    "oxygen_saturation": 94
                },
                "treatment_status": "in-progress",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/women/6.jpg"
            },
            {
                "patient_id": "PAT007",
                "name": "Alex Kim",
                "age": 29,
                "diagnosis": "Gallstones",
                "admission_date": "2025-09-23",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "120/80",
                    "heart_rate": 78,
                    "temperature": 98.2,
                    "respiratory_rate": 17,
                    "oxygen_saturation": 96
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/men/7.jpg"
            },
            {
                "patient_id": "PAT008",
                "name": "Sara Iqbal",
                "age": 37,
                "diagnosis": "Asthma Attack",
                "admission_date": "2025-10-02",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "124/79",
                    "heart_rate": 88,
                    "temperature": 98.1,
                    "respiratory_rate": 20,
                    "oxygen_saturation": 95
                },
                "treatment_status": "in-progress",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/women/8.jpg"
            },
            {
                "patient_id": "PAT009",
                "name": "David Green",
                "age": 72,
                "diagnosis": "Stroke Rehab",
                "admission_date": "2025-09-29",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "142/90",
                    "heart_rate": 80,
                    "temperature": 98.3,
                    "respiratory_rate": 16,
                    "oxygen_saturation": 94
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/men/9.jpg"
            },
            {
                "patient_id": "PAT010",
                "name": "Ananya Gupta",
                "age": 55,
                "diagnosis": "Heart Valve Replacement",
                "admission_date": "2025-09-28",
                "guardian_email": "yashasvipagdhune@gmail.com",
                "vital_signs": {
                    "blood_pressure": "132/84",
                    "heart_rate": 73,
                    "temperature": 98.5,
                    "respiratory_rate": 15,
                    "oxygen_saturation": 97
                },
                "treatment_status": "completed",
                "ready_for_discharge": False,
                "status": "pending",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "photo_url": "https://randomuser.me/api/portraits/women/10.jpg"
            }
        ]
        patients_collection.insert_many(sample_patients)
        print(" Sample data initialized with 10 patients!")