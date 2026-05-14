import streamlit as st
import requests

st.set_page_config(page_title="Diagnóstico SpaceChat", layout="wide")
st.title("🛰️ Diagnóstico de Conexión")

# 1. Usa tu API KEY aquí
api_key = "y04S2YI56Z8Rz8Xp05f6e87h66v98mS2" 
termino = st.text_input("Prueba de búsqueda:", "Iron Man")

if st.button("🔍 Probar Conexión"):
    url = f"https://api.giphy.com/v1/gifs/search?api_key={api_key}&q={termino}&limit=1"
    
    try:
        respuesta = requests.get(url)
        st.write(f"Código de respuesta del servidor: **{respuesta.status_code}**")
        
        if respuesta.status_code == 200:
            datos = respuesta.json()
            if datos['data']:
                st.success("✅ ¡Conexión exitosa! Giphy sí respondió.")
                st.image(datos['data'][0]['images']['fixed_height']['url'])
            else:
                st.warning("⚠️ La conexión sirve, pero Giphy no mandó imágenes. Quizás el término es muy raro.")
        
        elif respuesta.status_code == 403:
            st.error("❌ Error 403: Tu API KEY no es válida o está bloqueada.")
        
        elif respuesta.status_code == 429:
            st.error("❌ Error 429: Has hecho demasiadas búsquedas. Espera unos minutos.")
            
        else:
            st.error(f"❌ Error desconocido: {respuesta.text}")

    except Exception as e:
        st.error(f"💥 Error de red: No se pudo ni siquiera llegar a Giphy. {e}")
