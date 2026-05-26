import streamlit as st
import io
import requests
from google import genai
from google.genai import types

# Configuración de la página
st.set_page_config(page_title="H.A.R.V.I.S. 1.0 - Panel de Control", page_icon="🤖", layout="centered")

# Estilo visual
st.markdown("""
    <style>
    .stApp { background-color: #000000; color: #FFFFFF; }
    h1 { color: #FFD700 !important; text-align: center; }
    audio { border: 1px solid #FFD700; border-radius: 30px; }
    </style>
    """, unsafe_allow_html=True)

st.title("🤖 H.A.R.V.I.S. 1.0 — Cerebro Central")

# Inicializar cliente
@st.cache_resource
def get_ai_client():
    api_key = st.secrets.get("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)

client = get_ai_client()
HARVIS_PROMPT = "Eres H.A.R.V.I.S. 1.0, asistente inteligente, ingenioso y eficiente. Mantén respuestas cortas."

if "messages" not in st.session_state:
    st.session_state.messages = []

# Render historial
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "audio" in message:
            st.audio(message["audio"], format="audio/mpeg")

# Entrada
if user_input := st.chat_input("Escribe una orden..."):
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=user_input,
            config=types.GenerateContentConfig(system_instruction=HARVIS_PROMPT)
        )
        harvis_text = response.text or "Sistemas listos, Pedro."
        st.markdown(harvis_text)

        # PRUEBA ELEVENLABS
        with st.spinner("Generando voz con ElevenLabs..."):
            ELEVENLABS_API_KEY = "sk_5f39f949efd3639fa6b455623d7ab6d53d983a825400cc12"
            VOICE_ID = "EXAVITQu4vr4xnSDxMaL"
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
            
            headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
            payload = {"text": harvis_text, "model_id": "eleven_multilingual_v2"}
            
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                audio_bytes = response.content
                st.audio(audio_bytes, format="audio/mpeg")
                st.session_state.messages.append({"role": "assistant", "content": harvis_text, "audio": audio_bytes})
            else:
                st.error(f"Error ElevenLabs: {response.status_code} - {response.text}")
