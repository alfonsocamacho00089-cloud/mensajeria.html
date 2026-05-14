import streamlit as st
import requests
# PRUEBA CON ESTA LLAVE PÚBLICA (Cópiala tal cual)
API_KEY_PRUEBA = "dc6zaTOxFJmzC" 

url = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY_PRUEBA}&q=ironman&limit=1"
# PEGA TU CLAVE AQUÍ OTRA VEZ

st.title("Prueba Maestra de Conexión")

if st.button("🚀 Forzar búsqueda"):
    # Probamos con una búsqueda simple
    url = f"https://api.giphy.com/v1/gifs/search?api_key={tu_clave}&q=ironman&limit=1"
    
    res = requests.get(url)
    st.write(f"Respuesta del servidor: {res.status_code}")
    
    if res.status_code == 200:
        st.success("¡FUNCIONA! Tu clave ya está activa.")
        st.image(res.json()['data'][0]['images']['fixed_height']['url'])
    else:
        st.error(f"Giphy dice: {res.json()['meta']['msg']}")
