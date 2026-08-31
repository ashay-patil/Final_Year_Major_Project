import os
import json
from langchain_groq import ChatGroq
from database import patients_collection

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

def process_voice_text(raw_text: str, patient_id: str = None) -> dict:
    """Returns {structured_note: str, soap_format: dict, entities: dict}"""
    patient_context = ""
    if patient_id:
        patient = patients_collection.find_one({"patient_id": patient_id})
        if patient:
            patient_context = f"\nPatient Context: Name: {patient.get('name')}, Diagnosis: {patient.get('diagnosis')}"
            
    prompt = f"""
    You are an expert medical scribe AI. Convert the following rough voice transcription into a structured clinical note.
    Correct any medical terminology spelling errors.
    
    Raw Transcription: "{raw_text}"
    {patient_context}
    
    Please provide the output EXACTLY as a JSON object with the following structure:
    {{
        "structured_note": "A clean, professional summary of the clinical note",
        "soap_format": {{
            "subjective": "Patient's symptoms, feelings, and history as reported",
            "objective": "Measurable findings, vitals, lab results",
            "assessment": "Medical diagnosis or condition evaluation",
            "plan": "Treatment plan, medications, follow-up instructions"
        }},
        "entities": {{
            "medications": ["list of medications mentioned"],
            "symptoms": ["list of symptoms"],
            "diagnoses": ["list of diagnoses"],
            "procedures": ["list of procedures"]
        }}
    }}
    
    Respond ONLY with valid JSON. Do not include markdown formatting or extra text.
    """
    
    response = groq_llm.invoke(prompt)
    content = response.content.strip()
    
    # Strip markdown block if present
    if content.startswith('```json'):
        content = content[7:]
    if content.endswith('```'):
        content = content[:-3]
        
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        # Fallback if LLM fails to return valid JSON
        result = {
            "structured_note": raw_text,
            "soap_format": {
                "subjective": raw_text,
                "objective": "Not specified",
                "assessment": "Pending",
                "plan": "Pending"
            },
            "entities": {
                "medications": [],
                "symptoms": [],
                "diagnoses": [],
                "procedures": []
            }
        }
        
    return result
