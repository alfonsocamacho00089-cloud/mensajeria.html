import streamlit as st
import requests
import cv2
import tempfile
import os

st.set_page_config(page_title="YouSpaxio Compressor Test", page_icon="🎬")

st.title("⚡ YouSpaxio - Compresor en Tiempo Real")

# Recuperamos credenciales desde st.secrets
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"].rstrip('/')
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
except Exception:
    st.error("❌ Faltan las variables en tus Secrets de Streamlit.")
    st.stop()

BUCKET_NAME = "lives"
uploaded_file = st.file_uploader("Sube tu video pesado de la galería", type=["mp4", "webm"])

if uploaded_file is not None:
    st.warning(f"Ojo, el archivo original pesa: {uploaded_file.size / (1024*1024):.2f} MB")
    
    if st.button("🗜️ Comprimir y Subir"):
        with st.spinner("Procesando y bajando bitrate del video..."):
            # 1. Guardamos temporalmente el archivo pesado devuelto por el teléfono
            with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_original:
                temp_original.write(uploaded_file.read())
                path_original = temp_original.name

            path_comprimido = path_original.replace('.mp4', '_compressed.mp4')

            try:
                # 2. Usamos OpenCV para reconstruir el video con un codec altamente comprimido (H264 / XVID)
                cap = cv2.VideoCapture(path_original)
                fps = cap.get(cv2.CAP_PROP_FPS) or 30
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                
                # Forzamos un tamaño máximo para móviles (ej. 720p) si viene muy grande
                if width > 1280:
                    height = int(height * (1280 / width))
                    width = 1280

                fourcc = cv2.VideoWriter_fourcc(*'mp4v') # Codec estándar de MP4 ligero
                out = cv2.VideoWriter(path_comprimido, fourcc, fps, (width, height))

                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    # Redimensionamos cuadro por cuadro si es necesario
                    if width != int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)):
                        frame = cv2.resize(frame, (width, height))
                    out.write(frame)

                cap.release()
                out.release()

                # 3. Leemos el archivo resultante ya comprimido
                with open(path_comprimido, 'rb') as f:
                    bytes_comprimidos = f.read()

                peso_final = len(bytes_comprimidos) / (1024 * 1024)
                st.info(f"📉 ¡Compresión lista! El archivo bajó a: {peso_final:.2f} MB")

                # 4. Enviamos el binario ligero directo a Supabase
                file_name = f"comprimido_{uploaded_file.name}"
                upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
                
                headers = {
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "API-KEY": SUPABASE_KEY,
                    "Content-Type": "video/mp4"
                }

                response = requests.post(upload_url, headers=headers, data=bytes_comprimidos)

                if response.status_code == 200:
                    st.success("🎉 ¡Video ligero arriba en Supabase!")
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                    st.markdown(f"**🔗 Enlace público:** [{public_url}]({public_url})")
                else:
                    st.error(f"Error de Supabase: {response.status_code}")
                    st.code(response.text)

            except Exception as e:
                st.error(f"Fallo en el procesamiento: {e}")
            finally:
                # Limpieza de archivos temporales
                if os.path.exists(path_original): os.remove(path_original)
                if os.path.exists(path_comprimido): os.remove(path_comprimido)
