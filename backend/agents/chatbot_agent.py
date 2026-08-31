import os
import re
import chromadb

from langchain_groq import ChatGroq
from database import patients_collection


groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)


# In-memory session history
conversation_history = {}


def initialize_knowledge_base():
    """Seeds ChromaDB with hospital policies and medical guidelines on startup."""

    client = chromadb.PersistentClient(path="./chroma_db")

    collection = client.get_or_create_collection(
        name="mediflow_knowledge"
    )

    if collection.count() == 0:

        documents = [
            "Discharge Criteria: Patient must have stable vitals (Temp < 100.4, HR 60-100, BP < 140/90, O2 > 94%) and completed treatment.",

            "Visiting Policies: Visitors are allowed between 9 AM and 8 PM. Maximum 2 visitors per patient.",

            "Emergency Protocols: In case of cardiac arrest (Code Blue), initiate CPR and call the rapid response team.",

            "Common Procedures: Pre-operative fasting requires NPO for at least 8 hours before surgery."
        ]

        ids = [
            "doc1",
            "doc2",
            "doc3",
            "doc4"
        ]

        collection.add(
            documents=documents,
            ids=ids
        )

        print("Knowledge base seeded successfully.")


def extract_patient_id(message: str):
    """
    Extracts patient IDs such as PAT001, PAT002, etc.
    """

    match = re.search(
        r"\bPAT\d+\b",
        message.upper()
    )

    if match:
        return match.group(0)

    return None


def index_patient_data(patient: dict):
    """Indexes patient data into ChromaDB."""

    client = chromadb.PersistentClient(
        path="./chroma_db"
    )

    collection = client.get_or_create_collection(
        name="mediflow_knowledge"
    )

    patient_id = str(
        patient.get(
            "patient_id",
            patient.get("_id", "")
        )
    )

    if not patient_id:
        return

    doc_content = (
        f"Patient {patient.get('name', 'Unknown')}: "
        f"Age {patient.get('age', 'N/A')}, "
        f"Diagnosis: {patient.get('diagnosis', 'N/A')}, "
        f"Treatment Status: {patient.get('treatment_status', 'N/A')}."
    )

    collection.upsert(
        documents=[doc_content],
        metadatas=[
            {
                "type": "patient_data",
                "patient_id": patient_id
            }
        ],
        ids=[f"patient_{patient_id}"]
    )


def get_chatbot_response(
    message: str,
    patient_id: str = None,
    session_id: str = None
) -> dict:

    client = chromadb.PersistentClient(
        path="./chroma_db"
    )

    collection = client.get_or_create_collection(
        name="mediflow_knowledge"
    )

    # --------------------------------------------------
    # 1. Get session
    # --------------------------------------------------

    if session_id not in conversation_history:
        conversation_history[session_id] = {
            "patient_id": None,
            "messages": []
        }

    session = conversation_history[session_id]

    # --------------------------------------------------
    # 2. Extract patient ID from current message
    # --------------------------------------------------

    extracted_patient_id = extract_patient_id(message)

    if extracted_patient_id:
        patient_id = extracted_patient_id

        # Remember patient for this conversation
        session["patient_id"] = patient_id

    # --------------------------------------------------
    # 3. If no patient ID in current message,
    #    use previously selected patient
    # --------------------------------------------------

    elif not patient_id:

        patient_id = session.get("patient_id")

    # --------------------------------------------------
    # 4. Retrieve hospital knowledge
    # --------------------------------------------------

    results = collection.query(
        query_texts=[message],
        n_results=3
    )

    context_docs = (
        results["documents"][0]
        if results["documents"]
        else []
    )

    # --------------------------------------------------
    # 5. Retrieve patient from MongoDB
    # --------------------------------------------------

    patient_context = ""

    if patient_id:

        patient = patients_collection.find_one(
            {
                "patient_id": patient_id
            }
        )

        if patient:

            patient_context = f"""
Patient ID: {patient.get('patient_id')}
Name: {patient.get('name', 'N/A')}
Age: {patient.get('age', 'N/A')}
Diagnosis: {patient.get('diagnosis', 'N/A')}
Treatment Status: {patient.get('treatment_status', 'N/A')}
Vitals: {patient.get('vital_signs', 'N/A')}
"""

        else:

            patient_context = f"""
Patient ID: {patient_id}

No patient with this ID was found in the hospital database.
"""

    # --------------------------------------------------
    # 6. Conversation history
    # --------------------------------------------------

    history_list = session["messages"]

    history = ""

    if history_list:

        history = (
            "\nConversation History:\n"
            + "\n".join(history_list[-8:])
        )

    # --------------------------------------------------
    # 7. Build prompt
    # --------------------------------------------------

    prompt = f"""
You are MediFlow AI, an internal hospital assistant.

IMPORTANT RULES:

1. The user is an authenticated hospital staff member.
2. Patient information provided by the backend is authorized for this conversation.
3. Never ask the user for passwords, login credentials, or authentication.
4. Use the patient information provided below when answering patient-specific questions.
5. Never invent patient information.
6. If the requested patient information is not available, clearly say that it is unavailable.
7. Do not confuse hospital policies with patient-specific information.
8. If a patient ID has been selected in this conversation, continue using that patient unless another patient ID is explicitly provided.

Retrieved Hospital Knowledge:

{' '.join(context_docs)}

Current Patient:

{patient_context}

Conversation History:

{history}

User Question:

{message}

Answer:
"""

    # --------------------------------------------------
    # 8. Call LLM
    # --------------------------------------------------

    response = groq_llm.invoke(prompt)

    answer = response.content.strip()

    # --------------------------------------------------
    # 9. Save conversation
    # --------------------------------------------------

    session["messages"].append(
        f"User: {message}"
    )

    session["messages"].append(
        f"AI: {answer}"
    )

    # --------------------------------------------------
    # 10. Return response
    # --------------------------------------------------

    return {
        "response": answer,
        "sources": context_docs,
        "patient_id": patient_id
    }