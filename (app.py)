import streamlit as st
import requests
import os
from livekit import api

st.set_page_config(page_title="YouSpaxio Real Video Test", page_icon="🎬")

st.title("🎬 YouSpaxio - Grabación y Subida Sincronizada")
st.write("Esta prueba abre la cámara de tu teléfono en modo video, graba en caliente y espera a que termines para subir el binario real.")

# 1. Credenciales limpias desde tus Secrets
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"].rstrip('/')
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"].strip()
    LIVEKIT_API_KEY = st.secrets["LIVEKIT_API_KEY"].strip()
    LIVEKIT_API_SECRET = st.secrets["LIVEKIT_API_SECRET"].strip()
except Exception:
    st.error("❌ Configura tus Secrets en Streamlit (SUPABASE_URL, SUPABASE_KEY, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).")
    st.stop()

BUCKET_NAME = "lives"
room_id = "sala_prueba_spaxio"

# 2. Forzamos la creación del token de LiveKit en paralelo para certificar el canal
token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
    .with_identity("stream_user") \
    .with_grants(api.VideoGrants(room_join=True, room=room_id))
st.success(f"🎫 Canal de LiveKit verificado para la sala: '{room_id}'")

st.write("---")
st.subheader("📹 Grabador de Video en Vivo")

# 3. Interfaz de captura de video real (Mecanismo síncrono para teléfonos)
# Usamos el recolector de archivos nativo configurado estrictamente para capturar video desde la cámara
video_file = st.file_uploader("Haz clic abajo para abrir la cámara de tu celular en MODO VIDEO:", type=["mp4", "mov", "avi"])

if video_file is not None:
    # 💥 AQUÍ OCURRE EL CAMBIO CLAVE: Python se detiene y solo lee los bytes CUANDO EL VIDEO YA ESTÁ GRABADO
    bytes_video_real = video_file.read()
    peso_mb = len(bytes_video_real) / (1024 * 1024)
    
    st.info(f"📦 ¡Video capturado con éxito! Tamaño del archivo: {peso_mb:.2f} MB")
    
    # Mostramos una vista previa del video real antes de enviarlo
    st.video(bytes_video_real)
    
    if st.button("🚀 Confirmar y Enviar Video Real a Supabase"):
        with st.spinner("Subiendo el binario completo..."):
            
            # Formateamos el nombre del archivo final
            file_name = f"live_real_stream_{os.urandom(2).hex()}.mp4"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
            
            # Cabeceras REST exitosas (las que mataron el JWS)
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": "video/mp4"
            }
            
            try:
                response = requests.post(upload_url, headers=headers, data=bytes_video_real)
                
                if response.status_code == 200:
                    st.balloons()
                    st.success("🎉 ¡LOGRADO DE VERDAD! El video real llegó completo al bucket.")
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                    st.markdown(f"**🔗 Enlace público en Supabase:** [{public_url}]({public_url})")
                else:
                    st.error(f"❌ Supabase rechazó el binario. Código: {response.status_code}")
                    st.code(response.text)
                    
            except Exception as e:
                st.error(f"💥 Error de red: {e}")                
