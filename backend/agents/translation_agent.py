import os
import json
from langchain_groq import ChatGroq

groq_llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="openai/gpt-oss-120b",
    temperature=0
)

def translate_medical_text(text: str, target_language: str) -> dict:
    """Returns {translated_text: str, target_language: str, source_language: 'English'}"""
    
    prompt = f"""
    You are a professional medical translator. Translate the following English medical text into {target_language}.
    
    Guidelines:
    1. Preserve medical terminology accuracy.
    2. Maintain the exact structure and sections of the original text.
    3. Keep medication names in English, but add a brief local language description if necessary.
    4. Use simple, patient-friendly language where appropriate for instructions.
    
    Original Text:
    {text}
    
    Provide the output EXACTLY as a JSON object:
    {{
        "translated_text": "The fully translated text here",
        "target_language": "{target_language}",
        "source_language": "English"
    }}
    
    Respond ONLY with valid JSON. Do not include markdown formatting or extra text.
    """
    
    response = groq_llm.invoke(prompt)
    content = response.content.strip()
    
    if content.startswith('```json'):
        content = content[7:]
    if content.endswith('```'):
        content = content[:-3]
        
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        # Fallback
        result = {
            "translated_text": content,
            "target_language": target_language,
            "source_language": "English"
        }
        
    return result
