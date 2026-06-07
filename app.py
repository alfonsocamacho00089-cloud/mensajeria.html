import streamlit as st
import requests
import os
from livekit import api  # Integración nativa de LiveKit

st.set_page_config(page_title="YouSpaxio LiveKit + Camera", page_icon="🔴")

st.title("🎛️ YouSpaxio - Panel de Control Total en Vivo")
st.write("Genera la credencial de LiveKit, activa tu cámara móvil y valida el Storage de Supabase.")

# 1. Extracción de secretos de producción
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"].rstrip('/')
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"].strip()
    LIVEKIT_API_KEY = st.secrets["LIVEKIT_API_KEY"].strip()
    LIVEKIT_API_SECRET = st.secrets["LIVEKIT_API_SECRET"].strip()
except Exception:
    st.error("❌ Revisa tus Secrets. Debes tener: SUPABASE_URL, SUPABASE_KEY, LIVEKIT_API_KEY y LIVEKIT_API_SECRET.")
    st.stop()

BUCKET_NAME = "lives"

# 2. SECCIÓN LIVEKIT: Creación de la sesión activa
st.subheader("🔑 Conexión de Canales LiveKit")
room_id = st.text_input("ID de la Sala Activa", value="sala_spaxio_live")

# Generamos el token dinámico idéntico al de tu backend en Vercel
token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
    .with_identity("mobile_tester") \
    .with_name("Pedro_Tester") \
    .with_grants(api.VideoGrants(room_join=True, room=room_id))

jwt_livekit = token.to_jwt()
st.success("🎫 Servidor LiveKit enlazado. Token de transmisión generado.")

with st.expander("Ver metadata del JWT de LiveKit"):
    st.code(jwt_livekit)

st.write("---")

# 3. SECCIÓN CÁMARA: Grabación del flujo binario en tu teléfono
st.subheader("📹 Grabador Local de Cámara Nativa")
video_capturado = st.camera_input("Captura un clip de 10-30 segundos para simular el cierre del directo")

if video_capturado is not None:
    bytes_video_real = video_capturado.read()
    peso_mb = len(bytes_video_real) / (1024 * 1024)
    st.info(f"📦 Flujo capturado en buffer: {peso_mb:.2f} MB")

    # 4. DISPARADOR DE SUBIDA SEGURA A SUPABASE
    if st.button("🚀 Confirmar Envío con Cabeceras REST Corregidas"):
        with st.spinner("Empujando binario real al bucket seguro..."):
            
            # Nombre de archivo estructurado como tu PWA
            file_name = f"live_{room_id}_{os.urandom(2).hex()}.mp4"
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
            
            # Cabeceras limpias que eliminan el "Invalid Compact JWS"
            headers = {
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "apikey": SUPABASE_KEY,
                "Content-Type": "video/mp4"
            }
            
            try:
                # Subida directa del flujo binario
                response = requests.post(upload_url, headers=headers, data=bytes_video_real)
                
                if response.status_code == 200:
                    st.balloons()
                    st.success("🎉 ¡FLUJO COMPLETO EXITOSO! LiveKit y Supabase sincronizados.")
                    
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                    st.markdown(f"**🔗 Enlace público listo para Firebase:** [{public_url}]({public_url})")
                    st.video(bytes_video_real)
                else:
                    st.error(f"❌ Supabase rechazó el binario. Código: {response.status_code}")
                    st.code(response.text)
                    
            except Exception as e:
                st.error(f"💥 Error en la petición de red: {e}")
