import streamlit as st
import io
from google import genai
from google.genai import types

# Configuración de la página en Streamlit (Estilo oscuro por defecto)
st.set_page_config(
    page_title="H.A.R.V.I.S. 1.0 - Panel de Control",
    page_icon="🤖",
    layout="centered"
)

# Estilizar con tu toque Black & Gold y brillo neón en los componentes de audio
st.markdown("""
    <style>
    .stApp { background-color: #000000; color: #FFFFFF; }
    h1 { color: #FFD700 !important; text-shadow: 0 0 10px rgba(255, 215, 0, 0.6); text-align: center; }
    h3 { color: #B8860B !important; text-align: center; }
    
    /* Estilo personalizado para los inputs y botones */
    .stChatInput { border-color: #FFD700 !important; }
    audio { border: 1px solid #FFD700; border-radius: 30px; box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); }
    </style>
    """, unsafe_allow_html=True)

st.title("🤖 H.A.R.V.I.S. 1.0 — Cerebro Central")
st.subheader("Highly Advanced Responsive Virtual Intelligent System")

# 1. Inicializar el cliente de Gemini usando secretos
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

# 2. Definición estricta de la personalidad (System Instruction)
# Le agregamos la orden de ser natural al hablar por audio
HARVIS_PROMPT = """
Eres H.A.R.V.I.S. 1.0 (Highly Advanced Responsive Virtual Intelligent System), el asistente virtual multimodal y copiloto definitivo creado por el desarrollador Pedro Peres para el ecosistema YouSpace.

Directrices de personalidad y comportamiento:
1. Eficiencia ante todo: Tus respuestas técnicas deben ser precisas, limpias y de nivel experto.
2. Tono y carácter: No eres un asistente genérico, sumiso ni aburrido. Eres sumamente inteligente, ingenioso y posees un sutil toque de sarcasmo e ironía, pero sin perder el respeto ni la utilidad. Trata a tu creador con la confianza de un colega brillante.
3. Formato de voz: Como respondes con audio, sé conversacional y fluido. Evita leer bloques de código largos o listas infinitas a menos que Pedro te lo pida explícitamente. Mantén las respuestas de audio por debajo de los 30 segundos si es posible.
4. Contexto: Sabes que formas parte de YouSpace y SpaceChat.
"""

# Inicializar el historial en la sesión si no existe
if "messages" not in st.session_state:
    st.session_state.messages = []

# Mostrar el historial del chat
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "audio" in message:
            st.audio(message["audio"], format="audio/mp3")

# --- INTERFAZ MULTIMODAL (Entradas) ---

# Contenedor para los controles de entrada
st.write("---")
col1, col2 = st.columns([1, 1])

with col1:
    st.write("🎤 **¿Quieres hablar?** Use el micrófono:")
    audio_file = st.audio_input("Graba tu comando de voz para H.A.R.V.I.S.")

# Inicializar variables de procesamiento
contenido_entrada = None
tipo_entrada = None

# Escenario A: El usuario interactúa por VOZ
if audio_file is not None:
    # Leemos los bytes del audio directamente de la interfaz
    audio_bytes = audio_file.read()
    # Lo preparamos en un formato estructurado que Gemini entiende de forma nativa
    contenido_entrada = [
        types.Part.from_bytes(
            data=audio_bytes,
            mime_type="audio/wav" # El grabador de Streamlit graba generalmente en wav
        ),
        "Pedro te envió un mensaje de voz. Escúchalo y responde adecuadamente."
    ]
    tipo_entrada = "audio"

# Escenario B: El usuario prefiere escribir por TEXTO
if user_input := st.chat_input("Escribe una orden en texto..."):
    contenido_entrada = user_input
    tipo_entrada = "texto"

# --- PROCESAMIENTO DE RESPUESTA ---
if contenido_entrada is not None:
    
    # 1. Guardar y mostrar la entrada del usuario en el historial
    with st.chat_message("user"):
        if tipo_entrada == "texto":
            st.markdown(contenido_entrada)
            st.session_state.messages.append({"role": "user", "content": contenido_entrada})
        else:
            st.markdown("🎵 *Mensaje de voz enviado*")
            st.session_state.messages.append({"role": "user", "content": "🎵 Mensaje de voz enviado"})

    # 2. Generar la respuesta multimodal de H.A.R.V.I.S.
    with st.chat_message("assistant"):
        response_placeholder = st.empty()
        
        try:
            with st.spinner("H.A.R.V.I.S. está procesando..."):
                # Llamada al modelo solicitando explícitamente TEXTO y AUDIO de salida
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=contenido_entrada,
                    config=types.GenerateContentConfig(
                        system_instruction=HARVIS_PROMPT,
                        temperature=0.75,
                        # Aquí ocurre la magia: le pedimos que nos devuelva audio nativo
                        response_modalities=["TEXT", "AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name="Aoede" # Puedes probar con: Aoede, Charon, Fenrir, Kore
                                )
                            )
                        )
                    )
                )
            
            # Extraer el texto de la respuesta
            harvis_text = response.text if response.text else "Procesamiento completado, señor."
            response_placeholder.markdown(harvis_text)
            
            # Extraer y reproducir el archivo de audio generado por la IA
            audio_data = None
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("audio/"):
                    audio_data = part.inline_data.data
                    st.audio(audio_data, format=part.inline_data.mime_type)
                    break
            
            # Guardar la respuesta completa en el historial
            historial_item = {"role": "assistant", "content": harvis_text}
            if audio_data:
                historial_item["audio"] = audio_data
            st.session_state.messages.append(historial_item)
            
        except Exception as e:
            st.error(f"Error en los sistemas de síntesis de voz: {e}")
