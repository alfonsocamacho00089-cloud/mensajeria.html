import streamlit as st
import requests

st.set_page_config(page_title="Space Tienda - Buscador Libre", layout="wide")

# Estilo Black & Gold
st.markdown("<style>.main { background-color: #000000; color: #ffd700; }</style>", unsafe_allow_html=True)
st.title("🛰️ Buscador Global SpaceChat")

API_KEY = "y04S2YI56Z8Rz8Xp05f6e87h66v98mS2"

# Aquí puedes escribir "carros", "messi", "explosiones", lo que quieras
terminos = st.text_input("Escribe lo que quieras buscar en la tienda:", "funny cats")

if st.button("🔍 Cargar GIFs"):
    # Buscamos en Giphy sin filtros pesados
    url_api = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY}&q={terminos}&limit=12"
    
    try:
        respuesta = requests.get(url_api).json()
        
        if not respuesta['data']:
            st.warning("No se encontró nada para esa búsqueda. Intenta con otra palabra.")
        else:
            cols = st.columns(3)
            for idx, item in enumerate(respuesta['data']):
                # Extraemos la URL directa
                url_gif = item['images']['fixed_height']['url']
                
                # Lo mostramos directo sin preguntar
                with cols[idx % 3]:
                    st.image(url_gif, use_column_width=True)
            
            st.success(f"✅ Mostrando resultados para: {terminos}")
            
    except Exception as e:
        st.error(f"Error de conexión: {e}")
