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

def discharge_readiness_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph node that evaluates patients for discharge readiness
    """
    print("🔍 Running Discharge Readiness Detection...")
    
    candidates = list(patients_collection.find({
        "treatment_status": "completed",
        "ready_for_discharge": False
    }))
    
    ready_patients = []
    
    for patient in candidates:
        # prompt for LLM evaluation
        prompt = PromptTemplate(
            input_variables=["patient_data"],
            template="""
            You are a medical AI assistant evaluating patient discharge readiness.
            
            Patient Data:
            Name: {name}
            Age: {age}
            Diagnosis: {diagnosis}
            Vital Signs: {vital_signs}
            Treatment Status: {treatment_status}
            
            Based on the vital signs and treatment completion, is this patient ready for discharge?
            Consider:
            - Stable vital signs within normal ranges
            - Treatment completed successfully
            - No concerning symptoms
            
            Respond with only: "READY" or "NOT_READY" followed by a brief medical reason.
            """
        )
        
        formatted_prompt = prompt.format(
            name=patient["name"],
            age=patient["age"],
            diagnosis=patient["diagnosis"],
            vital_signs=patient["vital_signs"],
            treatment_status=patient["treatment_status"]
        )
       
        response = groq_llm.invoke(formatted_prompt)
        decision = response.content.strip()
        
        if "READY" in decision:
            
            patients_collection.update_one(
                {"_id": patient["_id"]},
                {
                    "$set": {
                        "ready_for_discharge": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
         
            discharge_logs_collection.insert_one({
                "patient_id": patient["patient_id"],
                "action": "discharge_readiness_detected",
                "details": f"AI Decision: {decision}",
                "agent": "DischargeReadinessAgent",
                "timestamp": datetime.utcnow()
            })
            
            ready_patients.append(patient["patient_id"])
            print(f"{patient['name']} marked as ready for discharge")
        else:
            print(f"{patient['name']} not ready: {decision}")
    
    state["ready_patients"] = ready_patients
    state["processed_count"] = len(candidates)
    return state

def start_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """Initial node"""
    print("🚀 Starting MediFlow AI Discharge Workflow...")
    state["workflow_started"] = datetime.utcnow()
    return state

# LangGraph workflow
def create_discharge_workflow():
    workflow = StateGraph(dict)

    workflow.add_node("start", start_node)
    workflow.add_node("discharge_readiness", discharge_readiness_node)

    workflow.add_edge("start", "discharge_readiness")
    workflow.add_edge("discharge_readiness", END)

    workflow.set_entry_point("start")
    
    return workflow.compile()

# Initialize workflow
discharge_workflow = create_discharge_workflow()
