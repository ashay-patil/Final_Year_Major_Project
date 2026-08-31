from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
import os

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-70b-versatile",
    temperature=0.3
)

def generate_nurse_checklist(patient):
    """Generate diagnosis-specific nurse discharge checklist using AI"""
    
    prompt = PromptTemplate(
        input_variables=["patient_data"],
        template="""
You are a senior nursing supervisor creating a discharge checklist.

PATIENT INFORMATION:
Name: {name}
Age: {age} years
Diagnosis: {diagnosis}
Vital Signs: BP {blood_pressure}, HR {heart_rate} bpm, Temp {temperature}°F, O2 {oxygen_saturation}%

TASK:
Generate 6-8 SPECIFIC nursing tasks required before discharge for THIS SPECIFIC DIAGNOSIS.
Tasks should be:
- Clinically appropriate for the diagnosis
- Actionable and measurable
- In proper sequence
- Include specific medical procedures if needed

FORMAT:
Return ONLY a comma-separated list of tasks. No numbering, bullets, or extra text.

EXAMPLE FORMAT:
Administer final dose of IV antibiotics, Remove central line and dress site, Check and record final vital signs including oxygen saturation, Verify patient can self-administer insulin injections, Provide diabetic diet education, Review blood glucose monitoring technique, Ensure follow-up appointment scheduled, Collect and verify all discharge documentation

YOUR TASKS (specific to {diagnosis}):"""
    )
    
    formatted_prompt = prompt.format(
        name=patient["name"],
        age=patient["age"],
        diagnosis=patient["diagnosis"],
        blood_pressure=patient["vital_signs"]["blood_pressure"],
        heart_rate=patient["vital_signs"]["heart_rate"],
        temperature=patient["vital_signs"]["temperature"],
        oxygen_saturation=patient["vital_signs"]["oxygen_saturation"]
    )
    
    try:
        response = groq_llm.invoke(formatted_prompt)
        
        # Parse comma-separated tasks
        raw_tasks = response.content.strip()
        tasks = [task.strip() for task in raw_tasks.split(',') if task.strip()]
        
        # Clean up any numbering that might have been added
        tasks = [task.split('.', 1)[-1].strip() if '.' in task[:3] else task for task in tasks]
        
        # Ensure 6-8 tasks
        if len(tasks) < 6:
            print(f"⚠️ AI generated only {len(tasks)} tasks, using fallback")
            return generate_fallback_checklist(patient)
        
        return tasks[:8]
        
    except Exception as e:
        print(f"⚠️ Error generating checklist with AI: {e}")
        return generate_fallback_checklist(patient)

def generate_fallback_checklist(patient):
    """Generate diagnosis-specific checklist if AI fails"""
    diagnosis = patient['diagnosis'].lower()
    
    if "myocardial" in diagnosis or "heart" in diagnosis:
        return [
            "Administer final cardiac medications and document response",
            "Remove cardiac monitoring leads and check skin integrity",
            "Record final ECG and vital signs",
            "Educate patient on cardiac diet and sodium restriction",
            "Review medication schedule and demonstrate pill organizer use",
            "Provide heart failure warning signs card",
            "Ensure cardiology follow-up appointment scheduled within 7 days",
            "Verify patient has blood pressure monitor at home"
        ]
    
    elif "appendicitis" in diagnosis or "surgery" in diagnosis:
        return [
            "Administer final dose of prophylactic antibiotics",
            "Remove surgical drain if present and document output",
            "Inspect surgical site and change dressing",
            "Record final vital signs and check for fever",
            "Educate on wound care and signs of infection",
            "Review activity restrictions and lifting precautions",
            "Demonstrate proper wound cleaning technique",
            "Ensure surgical follow-up scheduled for suture removal"
        ]
    
    elif "copd" in diagnosis or "pneumonia" in diagnosis or "asthma" in diagnosis:
        return [
            "Administer final nebulizer treatment and document response",
            "Remove oxygen therapy and assess room air saturation",
            "Record final respiratory rate and lung sounds",
            "Demonstrate proper inhaler technique with spacer",
            "Educate on breathing exercises and pursed-lip breathing",
            "Review oxygen use instructions if prescribed for home",
            "Provide pulmonary rehabilitation information",
            "Ensure respiratory follow-up scheduled within 5-7 days"
        ]
    
    elif "diabetes" in diagnosis:
        return [
            "Check fasting blood glucose and document",
            "Demonstrate blood glucose monitoring technique",
            "Review insulin injection technique and rotation sites",
            "Educate on hypoglycemia recognition and treatment",
            "Provide diabetic diet plan and carb counting guide",
            "Review medication timing with meal schedule",
            "Ensure diabetes educator appointment scheduled",
            "Verify patient has glucose meter and supplies"
        ]
    
    elif "fracture" in diagnosis:
        return [
            "Assess cast integrity and circulation to extremity",
            "Check for signs of compartment syndrome",
            "Educate on cast care and keeping dry",
            "Demonstrate proper crutch walking or mobility aid use",
            "Review pain management and signs of complications",
            "Provide exercises to prevent joint stiffness",
            "Ensure orthopedic follow-up scheduled for X-ray",
            "Verify patient can safely navigate home environment"
        ]
    
    elif "stroke" in diagnosis:
        return [
            "Assess neurological status and document any changes",
            "Check blood pressure and ensure within target range",
            "Evaluate swallowing safety and diet consistency",
            "Demonstrate transfer techniques to caregiver",
            "Review antiplatelet or anticoagulant medication importance",
            "Educate on stroke warning signs F.A.S.T.",
            "Arrange home health services and physical therapy",
            "Ensure neurology follow-up scheduled within 7-10 days"
        ]
    
    else:
        return [
            "Administer final prescribed medications",
            "Remove any IV access and check site",
            "Record final complete vital signs",
            "Educate patient on medication regimen and timing",
            "Review post-discharge care instructions",
            "Ensure patient understands warning signs",
            "Verify follow-up appointment is scheduled",
            "Collect and organize all discharge documentation"
        ]