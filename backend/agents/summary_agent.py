from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from typing import Dict, Any
from datetime import datetime
import os
from database import patients_collection, discharge_logs_collection

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

def summary_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node to generate discharge summary for a patient
    """
    patient = state["patient"]
    
    # summary prompt
    prompt = PromptTemplate(
    input_variables=["name", "age", "diagnosis", "admission_date", "treatment_status", "ready_for_discharge", "vital_signs"],
    template="""
You are an AI medical assistant generating a highly structured, printable hospital discharge summary.
ONLY use this format (plain text, do not use asterisks or markdown):

AI-Generated Summary

Treatment Summary
- [One sentence per item, using a single '-' for each point]

Patient Improvement
- [Same]

Final Diagnosis
[Diagnosis on its own line]

Follow-up Advice
- [One line per follow-up recommendation, medication, appointment, restriction]

Doctor's Comments
[Free text, max 4 sentences.]

Never use asterisks or double stars. Never nest points. Insert a single blank line between each section.
"""
    )

    formatted_prompt = prompt.format(
    name=patient["name"],
    age=patient["age"],
    diagnosis=patient.get("diagnosis", ""),
    admission_date=patient.get("admission_date", ""),
    treatment_status=patient.get("treatment_status", ""),
    ready_for_discharge="YES" if patient.get("ready_for_discharge") else "NO",
    vital_signs=patient.get("vital_signs", {})
)

    response = groq_llm.invoke(formatted_prompt)
    summary = response.content.strip()
    
    discharge_logs_collection.insert_one({
        "patient_id": patient["patient_id"],
        "action": "discharge_summary_generated",
        "details": summary[:120] + "...",
        "agent": "SummaryAgent",
        "timestamp": datetime.utcnow()
    })
    state["summary"] = summary
    return state

def start_node(state: Dict[str, Any]) -> Dict[str, Any]:
    print("🚀 Starting Summary Workflow...")
    state["workflow_started"] = datetime.utcnow()
    return state

def create_summary_workflow():
    workflow = StateGraph(dict)
    workflow.add_node("start", start_node)
    workflow.add_node("make_summary", summary_node)
    workflow.add_edge("start", "make_summary")
    workflow.add_edge("make_summary", END)
    workflow.set_entry_point("start")
    return workflow.compile()
    
summary_workflow = create_summary_workflow()
