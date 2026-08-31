from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
import os

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-20b",
    temperature=0.3
)

def generate_prescription(patient, nurse_tasks):
    """Generate diagnosis-specific prescription using AI"""
    
    nurse_notes = nurse_tasks.get("handover_note", "") if nurse_tasks else "No nurse notes available"
    
    prompt = PromptTemplate(
        input_variables=["patient_data"],
        template="""
You are an expert clinical pharmacist generating a discharge prescription.

PATIENT INFORMATION:
- Name: {name}
- Age: {age} years
- Diagnosis: {diagnosis}
- Vital Signs: BP {bp}, HR {hr} bpm, Temp {temp}°F
- Nurse Notes: {nurse_notes}

INSTRUCTIONS:
Generate a SPECIFIC, DETAILED prescription based on the patient's diagnosis. Include:
1. Exact medication names (generic and brand if applicable)
2. Precise dosages with units (mg, ml, tablets, etc.)
3. Specific timing (morning/evening/night, before/after meals)
4. Duration of treatment
5. Special precautions for this specific condition

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

MEDICATIONS:
1. [Drug Name] - [Dosage] - [Frequency] - [Timing] - [Duration]
   Purpose: [Why this medication]
   
2. [Drug Name] - [Dosage] - [Frequency] - [Timing] - [Duration]
   Purpose: [Why this medication]

INSTRUCTIONS:
- [Specific instruction 1 based on diagnosis]
- [Specific instruction 2 based on diagnosis]
- [Diet recommendations]
- [Activity restrictions]

PRECAUTIONS:
- [Warning 1]
- [Warning 2]

FOLLOW-UP:
- Schedule appointment: [specific timeframe]
- Watch for: [specific symptoms to monitor]
- Emergency signs: [when to seek immediate help]

BE SPECIFIC AND CLINICAL. Use actual drug names relevant to the diagnosis."""
    )
    
    formatted_prompt = prompt.format(
        name=patient["name"],
        age=patient["age"],
        diagnosis=patient["diagnosis"],
        bp=patient["vital_signs"]["blood_pressure"],
        hr=patient["vital_signs"]["heart_rate"],
        temp=patient["vital_signs"]["temperature"],
        nurse_notes=nurse_notes
    )
    
    try:
        response = groq_llm.invoke(formatted_prompt)
        return response.content.strip()
    except Exception as e:
        print(f"⚠️ Error generating prescription with AI: {e}")
        return generate_fallback_prescription(patient)

def generate_fallback_prescription(patient):
    """Generate basic prescription if AI fails"""
    diagnosis = patient['diagnosis'].lower()
    
    # Diagnosis-specific prescriptions
    if "myocardial" in diagnosis or "heart" in diagnosis:
        return """
MEDICATIONS:
1. Aspirin - 75mg - Once daily - Morning after breakfast - 30 days
   Purpose: Blood thinning to prevent clots

2. Atorvastatin - 20mg - Once daily - Bedtime - 30 days
   Purpose: Cholesterol management

3. Metoprolol - 50mg - Twice daily - Morning & evening - 30 days
   Purpose: Heart rate and blood pressure control

INSTRUCTIONS:
- Take all medications at the same time daily
- Avoid high-fat, high-sodium foods
- Limit physical exertion for 2 weeks
- Monitor blood pressure daily

PRECAUTIONS:
- Do not stop medications abruptly
- Report chest pain, shortness of breath immediately
- Avoid NSAIDs without doctor consultation

FOLLOW-UP:
- Schedule appointment: Within 7 days
- Watch for: Chest pain, irregular heartbeat, swelling
- Emergency signs: Severe chest pain, difficulty breathing
"""
    
    elif "appendicitis" in diagnosis:
        return """
MEDICATIONS:
1. Cefuroxime - 500mg - Twice daily - After meals - 7 days
   Purpose: Antibiotic to prevent infection

2. Paracetamol - 500mg - Three times daily - As needed for pain - 5 days
   Purpose: Pain relief

3. Pantoprazole - 40mg - Once daily - Before breakfast - 14 days
   Purpose: Stomach protection

INSTRUCTIONS:
- Complete full course of antibiotics
- Start with liquid diet, gradually increase to solids
- Avoid heavy lifting for 2 weeks
- Keep surgical site clean and dry

PRECAUTIONS:
- Watch for signs of infection (fever, redness, discharge)
- Do not miss antibiotic doses
- Avoid strenuous exercise

FOLLOW-UP:
- Schedule appointment: 7-10 days for wound check
- Watch for: Fever, severe pain, wound discharge
- Emergency signs: High fever (>101°F), severe abdominal pain
"""
    
    elif "copd" in diagnosis or "pneumonia" in diagnosis:
        return """
MEDICATIONS:
1. Salbutamol Inhaler - 2 puffs - Four times daily - Before meals & bedtime - 30 days
   Purpose: Bronchodilator for breathing

2. Budesonide Inhaler - 1 puff - Twice daily - Morning & evening - 30 days
   Purpose: Reduce airway inflammation

3. Azithromycin - 500mg - Once daily - After breakfast - 5 days
   Purpose: Antibiotic treatment

INSTRUCTIONS:
- Use inhalers correctly (rinse mouth after use)
- Avoid smoke, dust, and pollutants
- Practice breathing exercises
- Stay hydrated

PRECAUTIONS:
- Do not skip inhaler doses
- Report worsening breathlessness
- Avoid cold air exposure

FOLLOW-UP:
- Schedule appointment: Within 5-7 days
- Watch for: Increased breathlessness, chest pain
- Emergency signs: Severe difficulty breathing, blue lips
"""
    
    elif "diabetes" in diagnosis:
        return """
MEDICATIONS:
1. Metformin - 500mg - Twice daily - After breakfast & dinner - 30 days
   Purpose: Blood sugar control

2. Glimepiride - 2mg - Once daily - Before breakfast - 30 days
   Purpose: Insulin secretion

3. Vitamin B12 - 1000mcg - Once daily - After breakfast - 30 days
   Purpose: Prevent deficiency

INSTRUCTIONS:
- Monitor blood sugar levels twice daily
- Follow diabetic diet strictly
- Regular exercise (30 min walk daily)
- Maintain meal timing

PRECAUTIONS:
- Watch for low blood sugar symptoms
- Carry glucose tablets always
- Check feet daily for wounds

FOLLOW-UP:
- Schedule appointment: Every 2 weeks initially
- Watch for: Excessive thirst, frequent urination, fatigue
- Emergency signs: Severe hypoglycemia, confusion
"""
    
    else:
        return f"""
MEDICATIONS:
1. Paracetamol - 500mg - Three times daily - After meals - 5 days
   Purpose: Pain and fever management

2. Multivitamin - 1 tablet - Once daily - After breakfast - 30 days
   Purpose: Nutritional support

INSTRUCTIONS:
- Take medications as prescribed
- Maintain adequate hydration
- Rest adequately
- Follow up with doctor

PRECAUTIONS:
- Do not exceed recommended dosage
- Report any adverse reactions
- Store medications properly

FOLLOW-UP:
- Schedule appointment: Within 7-10 days
- Watch for: Worsening symptoms
- Emergency signs: High fever, severe pain

Patient: {patient['name']}
Diagnosis: {patient['diagnosis']}
"""