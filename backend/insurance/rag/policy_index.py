import chromadb

def get_client():
    return chromadb.PersistentClient(path="./chroma_db")

def index_policy_document(patient_id, policy_id, text_content):
    client = get_client()
    collection = client.get_or_create_collection(name="insurance_policy_chunks")
    
    # Very basic chunking
    chunks = [text_content[i:i+500] for i in range(0, len(text_content), 500)]
    
    ids = [f"{policy_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"patient_id": patient_id, "policy_id": policy_id} for _ in chunks]
    
    collection.add(
        documents=chunks,
        ids=ids,
        metadatas=metadatas
    )

def query_policy(claim_id, question, n_results=3):
    client = get_client()
    try:
        collection = client.get_collection(name="insurance_policy_chunks")
    except Exception:
        return []
    
    results = collection.query(
        query_texts=[question],
        n_results=n_results
    )
    
    if results["documents"] and len(results["documents"]) > 0:
        return results["documents"][0]
    return []
