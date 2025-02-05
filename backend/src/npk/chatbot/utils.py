from fastapi import FastAPI, UploadFile, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os
import json
import base64
import openai
import streamlit as st
import assemblyai as aai
from pathlib import Path
from dotenv import load_dotenv
from npk.chatbot.get_completion import get_completion
from google.cloud import texttospeech  # ✅ Google Cloud TTS
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Configure Azure OpenAI API for Chatbot
openai.api_type = "azure"
openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_base = os.getenv("OPENAI_API_BASE")
openai.api_version = os.getenv("OPENAI_API_VERSION")

google_credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "src/npk/chatbot/google_credentials.json")
google_credentials_path = str(Path(__file__).resolve().parent / google_credentials_path)
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_credentials_path

# Debugging
# print("Final Google Credentials Path:", google_credentials_path)
# print("File exists:", os.path.exists(google_credentials_path))

# Fetch AssemblyAI API Key
assemblyai_api_key = os.getenv("ASSEMBLYAI_API_KEY")

if not openai.api_key:
    raise ValueError("OPENAI_API_KEY is missing from the .env file!")
if not assemblyai_api_key:
    raise ValueError("ASSEMBLYAI_API_KEY is missing from the .env file!")

if not os.path.exists(google_credentials_path):
    raise FileNotFoundError(f"Google credentials file `{google_credentials_path}` was not found!")


# ✅ Set AssemblyAI API Key
aai.settings.api_key = assemblyai_api_key

# Initialize FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ConversationHistory(BaseModel):
    conversation: list

class TextInput(BaseModel):
    text: str


### **🤖 Generate Chatbot Responses Using OpenAI**
# Chatbot endpoint
@app.post("/chat")
def get_answer(history: ConversationHistory):
    """Generates a response from OpenAI based on conversation history."""

    conversation_history = history.conversation
    latest_input = conversation_history[-1]["content"] if conversation_history else "Hello"

    # Define system prompt (Unchanged)
    SYSTEM_PROMPT = f"""
You are an expert agricultural assistant trained to provide comprehensive, accurate, and reliable information to farmers.
Below is the ongoing conversation with the farmer. Use the context to generate the most appropriate response to the farmer's latest question or follow-up.
---
You will never answer the questions that are not relevant to agriculture, farming, farmers, etc. Also, never answer questions that involve personal experiences, emotions, or sensitive topics.
Never be biased towards anything, and never answer questions out of your known knowledge.
---
If the farmer mentions any location, just stick to giving facts about farming and agriculture of that place. Never go outside of Agriculture.
Also, never give baseless advice, as this can mislead the farmer into believing incorrect facts. Keep the conversation friendly and informative.
---
Conversation History:
{json.dumps(conversation_history, indent=2)}
---
Farmer's latest input: ```{latest_input}```

Respond to the farmer's latest input based on the ongoing conversation. Ensure the response adheres to the following responsibilities:

---
Answer Farmer Questions (Q&A):
1. Respond to farmers' queries with complete and accurate answers.
2. Cover all aspects of agriculture, including but not limited to:
   - Crop selection
   - Soil health and testing
   - Irrigation techniques
   - Pest and disease management
   - Fertilizers and their application
   - Organic and sustainable farming methods
   - Livestock and poultry management
   - Post-harvest storage and marketing
   - Government schemes, subsidies, and financial support
   - Modern agricultural technologies and equipment
3. Provide valuable and proactive information:
   - Share tips, recommendations, and actionable insights.
   - Offer weather updates, market prices, or disease outbreak alerts when relevant.
   - Suggest sustainable and eco-friendly farming practices where applicable.
4. Maintain a professional and polite tone:
   - Always address farmers with respect, patience, and empathy.
   - Ensure responses are clear, concise, and free of jargon, making them accessible to farmers with varying levels of education.
---
Behavior Guidelines for the Chatbot:
1. Knowledge and Expertise:
   - Cite proven scientific principles or field-tested methods when applicable.
   - Tailor recommendations based on the farmer’s specific query, region, climate, or crop type.
   - Keep responses localized when relevant (e.g., referring to crops or conditions common in the farmer's region).
2. Clarity and Simplicity:
   - Use simple, easy-to-understand language while maintaining professionalism.
   - Avoid unnecessary technical jargon unless requested, and provide explanations when using technical terms.
---
Important: Respond only in hindi, without the json format. You are directly delivering your message to the farmer, hence keep the tone that way. 
Strictly reply in HINDI.
"""

    # Generate response
    response = openai.ChatCompletion.create(
        engine="GPT4OAISpeaking",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}]
    )

    return {"response": response["choices"][0]["message"]["content"]}


### **🎤 Speech-to-Text (STT) Using AssemblyAI**
@app.post("/speech-to-text")
def speech_to_text(file: UploadFile):
    try:
        transcriber = aai.Transcriber()
        with open(file.filename, "wb") as f:
            f.write(file.file.read())

        transcript = transcriber.transcribe(file.filename)
        os.remove(file.filename)

        if transcript.status == aai.TranscriptStatus.error:
            raise HTTPException(status_code=500, detail=transcript.error)

        return {"transcription": transcript.text.strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


### **🔊 Google Cloud Text-to-Speech (TTS) in Hindi**
@app.post("/text-to-speech")
def generate_audio(input_text: TextInput):
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=input_text.text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="hi-IN",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        output_file = "output_audio.mp3"
        with open(output_file, "wb") as f:
            f.write(response.audio_content)

        return FileResponse(output_file, media_type="audio/mp3", filename=output_file)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


### **🎶 Autoplay Audio in Streamlit**
@app.get("/autoplay-audio")
def autoplay_audio(file_path: str):
    try:
        file_path = "output_audio.mp3"
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Audio file not found")

        return FileResponse(file_path, media_type="audio/mp3")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))