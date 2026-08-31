import os
import requests

api_key = os.getenv("GROQ_API_KEY")

print("API key loaded:", bool(api_key))

response = requests.get(
    "https://api.groq.com/openai/v1/models",
    headers={
        "Authorization": f"Bearer {api_key}"
    }
)

print("Status:", response.status_code)
print(response.text)