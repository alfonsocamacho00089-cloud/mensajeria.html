import streamlit as st
import requests

st.set_page_config(page_title="YouSpaxio Live Test", page_icon="🎥")

st.title("⚡ Prueba de Subida Directa - YouSpaxio")
st.write("Sube un video corto para probar la integración con Supabase Storage.")

# 1. Recuperamos las credenciales desde st.secrets automáticamente
# Debes tener configurado en tus Secrets: SUPABASE_URL y SUPABASE_KEY
try:
    SUPABASE_URL = st.secrets["SUPABASE_URL"]
    SUPABASE_KEY = st.secrets["SUPABASE_KEY"]
except Exception:
    st.error("❌ Faltan las variables SUPABASE_URL o SUPABASE_KEY en tus Secrets de Streamlit.")
    st.stop()

# Asegurar que la URL no termine con barra
SUPABASE_URL = SUPABASE_URL.rstrip('/')
BUCKET_NAME = "lives"

# 2. Selector de archivos para tu teléfono
uploaded_file = st.file_uploader("Selecciona un video (.mp4)", type=["mp4", "webm"])

if uploaded_file is not None:
    file_name = uploaded_file.name
    st.info(f"Archivo cargado en memoria: {file_name} ({uploaded_file.size} bytes)")
    
    if st.button("🚀 Lanzar subida a Supabase"):
        with st.spinner("Subiendo binario directamente..."):
            try:
                # Leemos los bytes puros del video
                file_bytes = uploaded_file.read()
                
                # Construimos la URL de la API de Supabase para subida directa por REST
                # Usamos la ruta /object/ para subir el archivo
                upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{file_name}"
                
                # Cabeceras requeridas por Supabase para autenticar y definir el tipo
                headers = {
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "API-KEY": SUPABASE_KEY,
                    "Content-Type": uploaded_file.type
                }
                
                # Enviamos el binario crudo mediante POST
                response = requests.post(upload_url, headers=headers, data=file_bytes)
                
                if response.status_code == 200:
                    st.success("🎉 ¡Éxito total! El video llegó a Supabase.")
                    
                    # Generamos la URL pública para comprobar
                    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{file_name}"
                    st.markdown(f"**🔗 URL Pública del Video:** [{public_url}]({public_url})")
                    
                    # Intentamos reproducirlo en Streamlit para verificar que no esté corrupto
                    st.video(file_bytes)
                else:
                    st.error(f"❌ Supabase rechazó el archivo. Status: {response.status_code}")
                    st.code(response.text)
                    
            except Exception as e:
                st.error(f"💥 Ocurrió un error en la petición: {e}")
