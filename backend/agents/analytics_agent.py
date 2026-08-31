import os
import datetime
import random
from langchain_groq import ChatGroq
from database import patients_collection

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

def get_analytics_overview() -> dict:
    """Returns aggregated metrics for the analytics dashboard"""
    all_patients = list(patients_collection.find({}))
    total_patients = len(all_patients)
    
    discharged_statuses = ['discharge_complete', 'billing_completed', 'summary_completed']
    discharged_count = sum(1 for p in all_patients if p.get('status') in discharged_statuses)
    
    # Calculate length of stay from admission_date
    now = datetime.datetime.utcnow()
    total_los = 0
    for p in all_patients:
        try:
            adm = datetime.datetime.strptime(p.get('admission_date', ''), '%Y-%m-%d')
            total_los += max((now - adm).days, 1)
        except:
            total_los += 5  # default
    avg_length_of_stay = round(total_los / total_patients, 1) if total_patients > 0 else 0.0
    
    bed_occupancy_rate = round(((total_patients - discharged_count) / 500) * 100, 1)
    
    # Diagnosis distribution
    diagnoses = {}
    for p in all_patients:
        diag = p.get('diagnosis', 'Unknown')
        diagnoses[diag] = diagnoses.get(diag, 0) + 1
        
    diagnosis_distribution = [
        {"name": k, "count": v, "percentage": round((v/total_patients)*100, 1)} 
        for k, v in diagnoses.items()
    ]
    
    # Discharge trends (simulated for last 7 days with realistic variation)
    discharge_trends = []
    today = datetime.datetime.now()
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        base = max(1, total_patients // 7)
        discharge_trends.append({
            "date": d.strftime("%b %d"),
            "count": base + random.randint(0, 3)
        })
        
    workflow_timing = {
        "avg_doctor_to_nurse": "45 mins",
        "avg_nurse_to_pharmacy": "1 hr 15 mins",
        "avg_total": "2 hrs 30 mins"
    }
    
    # Status breakdown
    statuses = {}
    for p in all_patients:
        status = p.get('status', 'pending')
        statuses[status] = statuses.get(status, 0) + 1
        
    status_breakdown = [
        {"status": k, "count": v} for k, v in statuses.items()
    ]
    
    # Avg LOS by diagnosis
    diag_los = {}
    diag_count = {}
    for p in all_patients:
        diag = p.get('diagnosis', 'Unknown')
        try:
            adm = datetime.datetime.strptime(p.get('admission_date', ''), '%Y-%m-%d')
            los = max((now - adm).days, 1)
        except:
            los = 5
        diag_los[diag] = diag_los.get(diag, 0) + los
        diag_count[diag] = diag_count.get(diag, 0) + 1
        
    avg_los_by_diagnosis = [
        {"diagnosis": k, "avg_days": round(diag_los[k]/diag_count[k], 1)}
        for k in diag_los.keys()
    ]
    
    return {
        "total_patients": total_patients,
        "discharged_count": discharged_count,
        "avg_length_of_stay": avg_length_of_stay,
        "bed_occupancy_rate": bed_occupancy_rate,
        "diagnosis_distribution": diagnosis_distribution,
        "discharge_trends": discharge_trends,
        "workflow_timing": workflow_timing,
        "status_breakdown": status_breakdown,
        "avg_los_by_diagnosis": avg_los_by_diagnosis
    }

def get_ai_insights() -> list[str]:
    """Returns AI-generated insights about hospital operations"""
    stats = get_analytics_overview()
    
    prompt = f"""
    You are an AI hospital administrator analyzing the following operational data:
    - Total Patients: {stats['total_patients']}
    - Discharged: {stats['discharged_count']}
    - Avg Length of Stay: {stats['avg_length_of_stay']} days
    - Bed Occupancy: {stats['bed_occupancy_rate']}%
    - Workflow Timings: {stats['workflow_timing']}
    - Diagnoses: {', '.join([d['name'] for d in stats['diagnosis_distribution']])}
    
    Based on this data, generate 4-5 clear, actionable, and professional insights.
    Format each insight as a single bullet point string. Do not include introductory text.
    Example: "Cardiac patients have 23% longer average stay compared to general patients."
    """
    
    response = groq_llm.invoke(prompt)
    content = response.content.strip()
    
    insights = []
    for line in content.split('\n'):
        line = line.strip()
        if line.startswith('- ') or line.startswith('* '):
            insights.append(line[2:].strip())
        elif len(line) > 10:
            insights.append(line.lstrip('1234567890. ').strip())
            
    return insights[:5]
