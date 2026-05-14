import streamlit as st
import requests
import json

# Configuración de la página con los colores de SpaceChat
st.set_page_config(page_title="Space Tienda - Previsualización", layout="wide")

st.markdown("""
    <style>
    .main { background-color: #000000; color: #ffd700; }
    .stButton>button { background-color: #ffd700; color: black; border-radius: 20px; }
    </style>
    """, unsafe_allow_html=True)

st.title("🛰️ Satélite SpaceChat: Verificador de Media")

# Configuración de búsqueda
API_KEY = "y04S2YI56Z8Rz8Xp05f6e87h66v98mS2" 
terminos = st.text_input("Términos de búsqueda (ej: anime goku, shinobu kocho):", "anime goku")

if st.button("🚀 Verificar y Cargar Tienda"):
    url_api = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY}&q={terminos}&limit=20"
    
    try:
        respuesta = requests.get(url_api).json()
        urls_verificadas = []
        
        st.subheader("Resultados del Escaneo:")
        
        cols = st.columns(4)
        col_idx = 0
        
        for item in respuesta['data']:
            url_gif = item['images']['fixed_height']['url']
            
            # --- BLOQUE CORREGIDO ---
            try:
                # Ahora sí tiene los espacios necesarios hacia adentro
                chequeo = requests.get(url_gif, stream=True, timeout=5)
                if chequeo.status_code == 200:
                    urls_verificadas.append(url_gif)
                    
                    with cols[col_idx % 4]:
                        st.image(url_gif, caption="✅ Verificado")
                    col_idx += 1
                else:
                    st.error(f"❌ Rota: {url_gif[:30]}...")
            except Exception as e:
                st.warning(f"Error de conexión con un GIF: {e}")
                continue

        # Generar el JSON de prueba
        datos_tienda = {
            "stickers": urls_verificadas,
            "temas": [
                {"nombre": "Space Gold", "fondo": "#000000", "acento": "#ffd700"}
            ]
        }
        
        st.success(f"¡Listo! Se verificaron {len(urls_verificadas)} imágenes correctamente.")
        
        st.subheader("Archivo JSON resultante (p2p.json):")
        st.json(datos_tienda)
        
    except Exception as e:
        st.error(f"Error crítico en la API: {e}") # Corregido también el espacio aquí
