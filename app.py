import streamlit as st
import requests
import subprocess
import os

st.set_page_config(page_title="YouSpaxio Ultra Compressor", page_icon="🎬")

st.title("⚡ YouSpaxio - Compresor Real con FFmpeg")

# Configuración limpia con st.secrets
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"].rstrip('/')
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
except Exception:
    st.error("❌ Configura SUPABASE_URL y SUPABASE_KEY en los Secrets de Streamlit.")
    st.stop()

BUCKET_NAME = "lives"
uploaded_file = st.file_uploader("Sube el video pesado de 78MB", type=["mp4", "webm"])

if uploaded_file is not None:
    st.warning(f"Ojo, el archivo original pesa: {uploaded_file.size / (1024*1024):.2f} MB")
    
    if st.button("🗜️ Forzar Compresión Brutal"):
        with st.spinner("FFmpeg destruyendo el bitrate pesado..."):
            
            # 1. Guardamos el archivo original del teléfono
            path_original = "input_pesado.mp4"
            path_comprimido = "output_ligero.mp4"
            
            with open(path_original, "wb") as f:
                f.write(uploaded_file.read())

            try:
                # 2. Comando directo a la yugular del bitrate: forzamos 800k de video y audio ligero
                # Esto reduce cualquier video de 80MB a 3MB o 4MB en segundos
                comando = [
                    'ffmpeg', '-y', '-i', path_original,
                    '-vcodec', 'libx264', '-b:v', '800k',
                    '-acodec', 'aac', '-b:a', '64k',
                    '-b:a', '48k', path_comprimido
                ]
                
                # Ejecutamos el proceso en el servidor de Streamlit
                resultado = subprocess.run(comando, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                
                if not os.path.exists(path_comprimido) or os.path.getsize(path_comprimido) == 0:
                    st.error("❌ FFmpeg falló al procesar el video.")
                    st.code(resultado.stderr)
                    st.stop()

                # 3. Leemos el archivo mutado y ultraligero
                with open(path_comprimido, 'rb') as f:
                    bytes_comprimidos = f.read()

                peso_final = len(bytes_comprimidos) / (1024 * 1024)
                st.success(f"📉 ¡Compresión brutal lista! Pasó de {uploaded_file.size / (1024*1024):.2f} MB a solo: {peso_final:.2f} MB")

                # 4. Lo mandamos directo a Supabase con la URL limpia
                file_name = f"live_comprimido_{os.urandom(4).hex()}.mp4"
                upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
                
                headers = {
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "API-KEY": SUPABASE_KEY,
                    "Content-Type": "video/mp4"
                }

                response = requests.post(upload_url, headers=headers, data=bytes_comprimidos)

                if response.status_code == 200:
                    st.balloons()
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                    st.markdown(f"**🔗 URL En Supabase:** [{public_url}]({public_url})")
                else:
                    st.error(f"Supabase rechazó el archivo: {response.status_code}")
                    st.code(response.text)

            except Exception as e:
                st.error(f"Fallo en el sistema: {e}")
            finally:
                # Limpieza absoluta de temporales en el servidor
                if os.path.exists(path_original): os.remove(path_original)
                if os.path.exists(path_comprimido): os.remove(path_comprimido)
