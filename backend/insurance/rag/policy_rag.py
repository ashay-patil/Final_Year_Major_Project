import os
from langchain_groq import ChatGroq
from .policy_index import query_policy

def ask_policy(claim_id, question):
    chunks = query_policy(claim_id, question)
    if not chunks:
        return {"answer": "No policy document available for this claim. Cannot answer.", "source_chunks": []}
    
    llm = ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model="openai/gpt-oss-120b", temperature=0)
    prompt = f"""You are a policy document analyzer. Answer ONLY based on the provided policy excerpts. If the answer is not in the excerpts, say 'Not covered in the available policy document.'

Policy Excerpts:
{chr(10).join(chunks)}

Question: {question}

Answer:"""
    # Wrap in timeout
    from concurrent.futures import ThreadPoolExecutor, TimeoutError
    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(lambda: llm.invoke(prompt).content.strip())
        try:
            answer = future.result(timeout=15)
        except (TimeoutError, Exception):
            answer = "AI explanation unavailable — policy chunks retrieved but LLM timed out."
    
    return {"answer": answer, "source_chunks": chunks[:3]}
