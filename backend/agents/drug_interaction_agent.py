import os
import json
from langchain_groq import ChatGroq

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

def check_drug_interactions(medications: list[str]) -> dict:
    """Check for drug-drug interactions among a list of medications.
    Returns {
        interactions: [
            {
                drug_pair: [str, str],
                severity: 'mild' | 'moderate' | 'severe' | 'critical',
                description: str,
                recommendation: str
            }
        ],
        safe_count: int,
        total_checked: int,
        overall_risk: 'safe' | 'caution' | 'dangerous'
    }
    """
    if not medications or len(medications) < 2:
        return {"interactions": [], "safe_count": len(medications), "total_checked": 0, "overall_risk": "safe"}

    prompt = f"""
You are a clinical pharmacology AI. Analyze the following list of medications for potential drug-drug interactions.

Medications: {', '.join(medications)}

For EACH pair of drugs that could interact, provide:
1. The drug pair
2. Severity: mild, moderate, severe, or critical
3. A brief description of the interaction and its clinical significance
4. A recommendation for the healthcare provider

Also for commonly known real interactions, flag them appropriately. If medications are generally safe together, indicate that.

Respond ONLY with valid JSON in this exact format:
{{
    "interactions": [
        {{
            "drug_pair": ["DrugA", "DrugB"],
            "severity": "moderate",
            "description": "Description of the interaction",
            "recommendation": "Clinical recommendation"
        }}
    ],
    "safe_count": <number of safe pairs>,
    "total_checked": <total pairs checked>,
    "overall_risk": "safe" or "caution" or "dangerous"
}}

Do not include markdown formatting. Respond ONLY with the JSON object.
"""

    response = groq_llm.invoke(prompt)
    content = response.content.strip()
    
    # Strip markdown if present
    if content.startswith('```json'):
        content = content[7:]
    if content.startswith('```'):
        content = content[3:]
    if content.endswith('```'):
        content = content[:-3]
    content = content.strip()
    
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        result = {
            "interactions": [],
            "safe_count": 0,
            "total_checked": 0,
            "overall_risk": "safe"
        }
    
    return result
