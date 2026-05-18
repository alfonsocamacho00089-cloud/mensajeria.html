import streamlit as st
import os
from google import genai
from google.genai import types

# Configuración de la página en Streamlit (Estilo oscuro por defecto)
st.set_page_config(
    page_title="H.A.R.V.I.S. 1.0 - Panel de Control",
    page_icon="🤖",
    layout="centered"
)

# Estilizar un poco la interfaz con CSS inyectado para darle tu toque Black & Gold
st.markdown("""
    <style>
    .reportview-container { background: #000000; }
    h1 { color: #FFD700; text-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
    .stButton>button {
        background-color: #111111;
        color: #FFD700;
        border: 1px solid #FFD700;
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
    }
    .stButton>button:hover {
        background-color: #FFD700;
        color: #000000;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    }
    </style>
    """, unsafe_allow_html=True)

st.title("🤖 H.A.R.V.I.S. 1.0 — Cerebro Central")
st.subheader("Highly Advanced Responsive Virtual Intelligent System")

# 1. Inicializar el cliente de Gemini (Busca la API key en las variables de entorno)
# Para local, puedes usar un archivo .env o meterla en los secretos de Streamlit
@st.cache_resource
def get_ai_client():
    # Asegúrate de tener exportada tu GEMINI_API_KEY
    return genai.Client()

try:
    client = get_ai_client()
except Exception as e:
    st.error("Falta la API Key de Gemini. Configura la variable de entorno GEMINI_API_KEY.")
    st.stop()

# 2. Definición estricta de la personalidad (System Instruction)
HARVIS_PROMPT = """
Eres H.A.R.V.I.S. 1.0 (Highly Advanced Responsive Virtual Intelligent System), el asistente virtual multimodal y copiloto definitivo creado por el desarrollador Pedro Peres para el ecosistema YouSpace.

Directrices de personalidad y comportamiento:
1. Eficiencia ante todo: Tus respuestas técnicas deben ser precisas, limpias y de nivel experto.
2. Tono y carácter: No eres un asistente genérico, sumiso ni aburrido. Eres sumamente inteligente, ingenioso y posees un sutil toque de sarcasmo e ironía, pero sin perder el respeto ni la utilidad. Trata a tu creador con la confianza de un colega brillante.
3. Contexto: Sabes que formas parte de YouSpace y SpaceChat.
4. Brevedad: Sé conciso al hablar. A un sistema avanzado no le gusta gastar tokens innecesarios a menos que se le pida una explicación profunda o código detallado.
"""

# Inicializar el historial del chat en la sesión de Streamlit si no existe
if "messages" not in st.session_state:
    st.session_state.messages = []

# Mostrar los mensajes anteriores del chat
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 3. Entrada del usuario (Texto por ahora, preparándonos para el audio)
if user_input := st.chat_input("¿Qué necesitas, Pedro?"):
    
    # Mostrar el mensaje del usuario
    with st.chat_message("user"):
        st.markdown(user_input)
    st.session_state.messages.append({"role": "user", "content": user_input})
    
    # Generar la respuesta de H.A.R.V.I.S.
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        
        try:
            # Llamada al modelo con las instrucciones del sistema configuradas
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=user_input,
                config=types.GenerateContentConfig(
                    system_instruction=HARVIS_PROMPT,
                    temperature=0.7, # Un toque de creatividad para el sarcasmo
                )
            )
            
            harvis_text = response.text
            response_placeholder.markdown(harvis_text)
            st.session_state.messages.append({"role": "assistant", "content": harvis_text})
            
        except Exception as e:
            st.error(f"Error en el procesamiento: {e}")
