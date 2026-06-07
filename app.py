import streamlit as st
import requests
import os
import asyncio
from livekit import api  # Necesitamos el SDK oficial para generar el token real

st.set_page_config(page_title="YouSpaxio LiveKit Test", page_icon="🔴")

st.title("🔴 YouSpaxio - Banco de Pruebas Real LiveKit")

# 1. Cargamos todos tus secretos limpios desde el panel de Streamlit
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"].rstrip('/')
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"].strip()
    LIVEKIT_API_KEY = st.secrets["LIVEKIT_API_KEY"].strip()
    LIVEKIT_API_SECRET = st.secrets["LIVEKIT_API_SECRET"].strip()
except Exception:
    st.error("❌ Faltan llaves en tus Secrets. Asegúrate de tener SUPABASE_URL, SUPABASE_KEY, LIVEKIT_API_KEY y LIVEKIT_API_SECRET.")
    st.stop()

BUCKET_NAME = "lives"

# 2. Simulación del disparador del directo
st.subheader("Simulador de Evento de Grabación")
room_name = st.text_input("Nombre de la sala de pruebas", value="sala_test_spaxio")

if st.button("▶ Iniciar Flujo y Forzar Subida Segura"):
    with st.spinner("Generando JWT de LiveKit y simulando empaquetado de transmisión..."):
        
        # Generamos el token de LiveKit exacto que usa tu app para asegurar que el canal existe
        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity("streamlit_tester") \
            .with_name("Tester") \
            .with_grants(api.VideoGrants(room_join=True, room=room_name))
            
        jwt_token = token.to_jwt()
        st.success("🎫 Token de LiveKit generado correctamente.")
        
        # Simulamos que el grabador de YouSpaxio terminó y reunió los fragmentos pesados
        # Creamos un archivo dummy temporal con metadata real de video MP4
        file_name = f"live_realtime_{room_name}.mp4"
        upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
        
        # Datos simulados del flujo real (reemplaza por bytes de un archivo si quieres)
        bytes_stream_real = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom" + os.urandom(1024 * 500) # 500KB limpios
        
        # 3. CABECERAS CORREGIDAS PARA ELIMINAR EL 403 INVALID COMPACT JWS
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "video/mp4"
        }
        
        st.write("📤 Empujando el binario al Storage seguro...")
        
        try:
            # Mandamos los bytes puros usando el método REST nativo
            response = requests.post(upload_url, headers=headers, data=bytes_stream_real)
            
            if response.status_code == 200:
                st.balloons()
                st.success("🎉 ¡CONECTADO Y GUARDADO! Supabase aceptó el flujo de datos.")
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                st.markdown(f"**🔗 URL del directo generada:** [{public_url}]({public_url})")
            else:
                st.error(f"❌ Error de Supabase ({response.status_code}):")
                st.code(response.text)
                
        except Exception as e:
            st.error(f"💥 Fallo de conexión: {e}")
