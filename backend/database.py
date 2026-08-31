from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DATABASE_NAME = "mediflow_ai"

# Nurse email for notifications
NURSE_EMAIL = os.getenv("NURSE_EMAIL", "nurse@stjudes.com")

client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Collections
patients_collection = db["patients"]
discharge_logs_collection = db["discharge_logs"]
nurse_tasks_collection = db["nurse_tasks"]

def get_database():
    return db

def get_nurse_email():
    return NURSE_EMAIL

# Sample data initialization
def init_sample_data():
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