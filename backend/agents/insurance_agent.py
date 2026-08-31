import os
import json
import chromadb
from langchain_groq import ChatGroq

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

# ==================== INSURANCE DATABASE ====================

INSURANCE_COMPANIES = {
    "star_health": {
        "name": "Star Health Insurance",
        "logo_color": "#3B82F6",
        "plan_name": "Family Health Optima",
        "bill_concession_percent": 70,
        "max_coverage": 500000,
        "covered_conditions": ["cardiac", "stroke", "diabetes", "surgery", "pneumonia", "fracture", "general"],
        "excluded_conditions": ["cosmetic", "dental"],
        "room_rent_limit_per_day": 4000,
        "copay_percent": 10,
        "waiting_period_days": 30,
        "network_hospitals": 12000,
        "claim_settlement_ratio": 91.2,
        "description": "India's leading standalone health insurer offering comprehensive coverage for families. Covers pre and post hospitalization up to 60/180 days."
    },
    "hdfc_ergo": {
        "name": "HDFC ERGO Health",
        "logo_color": "#EF4444",
        "plan_name": "Optima Secure",
        "bill_concession_percent": 65,
        "max_coverage": 750000,
        "covered_conditions": ["cardiac", "stroke", "diabetes", "surgery", "pneumonia", "fracture", "general", "copd"],
        "excluded_conditions": ["cosmetic"],
        "room_rent_limit_per_day": 5000,
        "copay_percent": 5,
        "waiting_period_days": 14,
        "network_hospitals": 13000,
        "claim_settlement_ratio": 93.5,
        "description": "Backed by HDFC group, offers Optima Secure with restore benefit and no room rent capping on higher plans. Includes free health checkups."
    },
    "max_bupa": {
        "name": "Niva Bupa (Max Bupa)",
        "logo_color": "#8B5CF6",
        "plan_name": "Health Recharge",
        "bill_concession_percent": 60,
        "max_coverage": 1000000,
        "covered_conditions": ["cardiac", "stroke", "diabetes", "surgery", "pneumonia", "general"],
        "excluded_conditions": ["cosmetic", "dental", "vision"],
        "room_rent_limit_per_day": 6000,
        "copay_percent": 15,
        "waiting_period_days": 30,
        "network_hospitals": 10000,
        "claim_settlement_ratio": 89.7,
        "description": "Premium health insurer with international expertise. Offers recharge benefit that restores sum insured if exhausted. No sub-limits on treatments."
    },
    "icici_lombard": {
        "name": "ICICI Lombard",
        "logo_color": "#F59E0B",
        "plan_name": "Health AdvantEdge",
        "bill_concession_percent": 55,
        "max_coverage": 500000,
        "covered_conditions": ["cardiac", "surgery", "pneumonia", "fracture", "general"],
        "excluded_conditions": ["cosmetic", "dental", "pre-existing (2yr wait)"],
        "room_rent_limit_per_day": 3500,
        "copay_percent": 20,
        "waiting_period_days": 45,
        "network_hospitals": 8500,
        "claim_settlement_ratio": 88.1,
        "description": "One of India's largest private general insurers. AdvantEdge plan offers cumulative bonus and wellness rewards. Budget-friendly premiums."
    },
    "bajaj_allianz": {
        "name": "Bajaj Allianz",
        "logo_color": "#10B981",
        "plan_name": "Health Guard Gold",
        "bill_concession_percent": 50,
        "max_coverage": 400000,
        "covered_conditions": ["cardiac", "stroke", "surgery", "pneumonia", "diabetes", "general"],
        "excluded_conditions": ["cosmetic", "dental", "maternity"],
        "room_rent_limit_per_day": 3000,
        "copay_percent": 15,
        "waiting_period_days": 30,
        "network_hospitals": 9000,
        "claim_settlement_ratio": 90.4,
        "description": "Trusted insurer with extensive network. Health Guard Gold offers automatic recharge and covers modern treatments including AYUSH."
    },
    "ayushman_bharat": {
        "name": "Ayushman Bharat (PMJAY)",
        "logo_color": "#06B6D4",
        "plan_name": "Government Scheme",
        "bill_concession_percent": 100,
        "max_coverage": 500000,
        "covered_conditions": ["cardiac", "stroke", "diabetes", "surgery", "pneumonia", "fracture", "copd", "general"],
        "excluded_conditions": ["cosmetic"],
        "room_rent_limit_per_day": 0,
        "copay_percent": 0,
        "waiting_period_days": 0,
        "network_hospitals": 25000,
        "claim_settlement_ratio": 95.0,
        "description": "Government of India's flagship health insurance scheme for BPL families. Covers up to ₹5 lakh per family per year for secondary and tertiary care. No premium for eligible families."
    }
}


# ==================== LANGCHAIN RAG FOR INSURANCE ====================

def _initialize_insurance_knowledge():
    """Seed insurance policy data into ChromaDB for RAG queries."""
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="insurance_policies")
    
    if collection.count() > 0:
        return  # Already seeded
    
    documents = []
    ids = []
    metadatas = []
    
    for key, company in INSURANCE_COMPANIES.items():
        doc = f"""
Insurance Company: {company['name']}
Plan: {company['plan_name']}
Coverage: Up to ₹{company['max_coverage']:,}
Bill Concession: {company['bill_concession_percent']}%
Co-pay: {company['copay_percent']}%
Room Rent Limit: ₹{company['room_rent_limit_per_day']:,}/day
Waiting Period: {company['waiting_period_days']} days
Network Hospitals: {company['network_hospitals']:,}
Claim Settlement Ratio: {company['claim_settlement_ratio']}%
Covered Conditions: {', '.join(company['covered_conditions'])}
Excluded: {', '.join(company['excluded_conditions'])}
Description: {company['description']}
"""
        documents.append(doc.strip())
        ids.append(f"insurance_{key}")
        metadatas.append({"type": "insurance_policy", "company_id": key})
    
    collection.add(documents=documents, ids=ids, metadatas=metadatas)
    print("Insurance knowledge base seeded into ChromaDB.")


def get_all_companies():
    """Return all insurance companies with their details."""
    return [
        {"id": key, **val}
        for key, val in INSURANCE_COMPANIES.items()
    ]


def calculate_insurance_concession(total_bill: float, company_id: str, diagnosis: str = "") -> dict:
    """Calculate bill after insurance concession."""
    company = INSURANCE_COMPANIES.get(company_id)
    if not company:
        return {"error": f"Unknown insurance company: {company_id}"}
    
    # Check if diagnosis is covered
    diagnosis_lower = diagnosis.lower()
    is_covered = any(cond in diagnosis_lower for cond in company["covered_conditions"])
    if not is_covered and "general" in company["covered_conditions"]:
        is_covered = True  # Fallback to general coverage
    
    if not is_covered:
        return {
            "company": company["name"],
            "is_covered": False,
            "reason": f"Diagnosis '{diagnosis}' is not covered under {company['plan_name']}",
            "original_amount": total_bill,
            "concession_amount": 0,
            "copay_amount": 0,
            "final_amount": total_bill
        }
    
    # Calculate concession
    concession_percent = company["bill_concession_percent"]
    max_coverage = company["max_coverage"]
    copay_percent = company["copay_percent"]
    
    # Concession is the percentage covered by insurance
    concession_amount = min(total_bill * (concession_percent / 100), max_coverage)
    
    # Co-pay is what patient pays on the covered amount
    copay_amount = concession_amount * (copay_percent / 100)
    
    # Final amount = Original - Concession + Copay
    final_amount = total_bill - concession_amount + copay_amount
    final_amount = max(final_amount, 0)
    
    return {
        "company": company["name"],
        "plan": company["plan_name"],
        "is_covered": True,
        "original_amount": round(total_bill, 2),
        "concession_percent": concession_percent,
        "concession_amount": round(concession_amount, 2),
        "copay_percent": copay_percent,
        "copay_amount": round(copay_amount, 2),
        "final_amount": round(final_amount, 2),
        "savings": round(total_bill - final_amount, 2),
        "savings_percent": round(((total_bill - final_amount) / total_bill) * 100, 1) if total_bill > 0 else 0
    }


def query_insurance_ai(question: str, patient_diagnosis: str = "") -> dict:
    """Use LangChain RAG to answer insurance-related questions."""
    _initialize_insurance_knowledge()
    
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="insurance_policies")
    
    # Retrieve relevant insurance docs
    results = collection.query(
        query_texts=[question],
        n_results=4
    )
    context_docs = results["documents"][0] if results["documents"] else []
    
    prompt = f"""
You are MediFlow Insurance AI Assistant. You help hospital staff and patients understand insurance coverage.

Available Insurance Information:
{chr(10).join(context_docs)}

{f'Patient Diagnosis: {patient_diagnosis}' if patient_diagnosis else ''}

User Question: {question}

Provide a clear, helpful answer. If comparing plans, use a structured format. Include specific numbers and percentages. If you don't have enough information, say so clearly.

Answer:
"""
    
    response = groq_llm.invoke(prompt)
    answer = response.content.strip()
    
    return {
        "answer": answer,
        "sources": context_docs[:2],
        "question": question
    }


def recommend_best_plan(diagnosis: str, total_bill: float) -> dict:
    """Use LangChain to recommend the best insurance plan for a patient."""
    _initialize_insurance_knowledge()
    
    # Calculate concession for each company
    comparisons = []
    for key, company in INSURANCE_COMPANIES.items():
        result = calculate_insurance_concession(total_bill, key, diagnosis)
        result["company_id"] = key
        result["claim_settlement_ratio"] = company["claim_settlement_ratio"]
        result["network_hospitals"] = company["network_hospitals"]
        comparisons.append(result)
    
    # Sort by savings (best first)
    covered = [c for c in comparisons if c.get("is_covered", False)]
    covered.sort(key=lambda x: x.get("savings", 0), reverse=True)
    
    # Use LLM to provide recommendation
    comparison_text = json.dumps(covered[:4], indent=2)
    
    prompt = f"""
You are an insurance advisor AI. Based on the following comparison data, recommend the best insurance plan.

Patient Diagnosis: {diagnosis}
Total Hospital Bill: ₹{total_bill:,.2f}

Plan Comparisons (sorted by savings):
{comparison_text}

Provide a brief 2-3 sentence recommendation explaining why the top plan is best, considering coverage amount, co-pay, claim settlement ratio, and network hospitals. Be specific with numbers.

Recommendation:
"""
    
    response = groq_llm.invoke(prompt)
    recommendation = response.content.strip()
    
    return {
        "recommendation": recommendation,
        "best_plan": covered[0] if covered else None,
        "all_plans": covered,
        "diagnosis": diagnosis,
        "total_bill": total_bill
    }
