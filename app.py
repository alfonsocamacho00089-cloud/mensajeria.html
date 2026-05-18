import streamlit as st
import io
from google import genai
from google.genai import types
from gtts import gTTS  # Librería para saltarnos el bloqueo de audio de la API

# Configuración de la página en Streamlit
st.set_page_config(
    page_title="H.A.R.V.I.S. 1.0 - Panel de Control",
    page_icon="🤖",
    layout="centered"
)

# Estilo visual Black & Gold
st.markdown("""
    <style>
    .stApp { background-color: #000000; color: #FFFFFF; }
    h1 { color: #FFD700 !important; text-shadow: 0 0 10px rgba(255, 215, 0, 0.6); text-align: center; }
    h3 { color: #B8860B !important; text-align: center; }
    .stChatInput { border-color: #FFD700 !important; }
    audio { border: 1px solid #FFD700; border-radius: 30px; box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
    </style>
    """, unsafe_allow_html=True)

st.title("🤖 H.A.R.V.I.S. 1.0 — Cerebro Central")
st.subheader("Highly Advanced Responsive Virtual Intelligent System")

@st.cache_resource
def get_ai_client():
    api_key = st.secrets.get("GEMINI_API_KEY")
    if not api_key:
        st.error("Falta la API Key en .streamlit/secrets.toml")
        st.stop()
    return genai.Client(api_key=api_key)

try:
    client = get_ai_client()
except Exception as e:
    st.error(f"Error en los módulos de conexión: {e}")
    st.stop()

HARVIS_PROMPT = """
Eres H.A.R.V.I.S. 1.0 (Highly Advanced Responsive Virtual Intelligent System), el asistente virtual multimodal y copiloto definitivo creado por el desarrollador Pedro Peres para el ecosistema YouSpace.

Directrices de personalidad y comportamiento:
1. Eficiencia ante todo: Tus respuestas técnicas deben ser precisas, limpias y de nivel experto.
2. Tono y carácter: No eres un asistente genérico, sumiso ni aburrido. Eres sumamente inteligente, ingenioso y posees un sutil toque de sarcasmo e ironía, pero sin perder el respeto ni la utilidad. Trata a tu creador con la confianza de un colega brillante.
3. Formato para audio: Tus textos serán convertidos a voz. Sé fluido, natural y evita leer bloques de código gigantescos a menos que Pedro te lo pida.
"""

if "messages" not in st.session_state:
    st.session_state.messages = []

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "audio" in message:
            st.audio(message["audio"], format="audio/mp3")

st.write("---")
col1, col2 = st.columns([1, 1])

with col1:
    st.write("🎤 **¿Quieres hablar?** Use el micrófono:")
    audio_file = st.audio_input("Graba tu comando de voz para H.A.R.V.I.S.")

contenido_entrada = None
tipo_entrada = None

if audio_file is not None:
    audio_bytes = audio_file.read()
    contenido_entrada = [
        types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
        "Pedro te envió un mensaje de voz. Escúchalo y responde con tu personalidad."
    ]
    tipo_entrada = "audio"

if user_input := st.chat_input("Escribe una orden en texto..."):
    contenido_entrada = user_input
    tipo_entrada = "texto"

if contenido_entrada is not None:
    with st.chat_message("user"):
        if tipo_entrada == "texto":
            st.markdown(contenido_entrada)
            st.session_state.messages.append({"role": "user", "content": contenido_entrada})
        else:
            st.markdown("🎵 *Mensaje de voz enviado*")
            st.session_state.messages.append({"role": "user", "content": "🎵 Mensaje de voz enviado"})

    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        
        try:
            with st.spinner("H.A.R.V.I.S. está procesando..."):
                # Solicitamos solo TEXTO para cumplir con las reglas del nivel gratuito
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=contenido_entrada,
                    config=types.GenerateContentConfig(
                        system_instruction=HARVIS_PROMPT,
                        temperature=0.75
                    )
                )
            
            harvis_text = response.text if response.text else "Sistemas operativos listos, Pedro."
            response_placeholder.markdown(harvis_text)
            
            # --- AQUÍ GENERAMOS EL AUDIO CON gTTS ---
            with st.spinner("Sintetizando respuesta de voz..."):
                tts = gTTS(text=harvis_text, lang='es', tld='com.mx') # Voz en español con buen tono
                fp = io.BytesIO()
                tts.write_to_fp(fp)
                audio_bytes_output = fp.getvalue()
                
                # Reproducir el audio generado localmente
                st.audio(audio_bytes_output, format="audio/mp3")
            
            # Guardar en el historial
            historial_item = {"role": "assistant", "content": harvis_text, "audio": audio_bytes_output}
            st.session_state.messages.append(historial_item)
            
        except Exception as e:
            st.error(f"Error en el procesamiento central: {e}")
