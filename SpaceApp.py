import streamlit as st
import requests
import json

st.set_page_config(page_title="Space Tienda - Previsualización", layout="wide")

# Estilo Black & Gold
st.markdown("<style>.main { background-color: #000000; color: #ffd700; }</style>", unsafe_allow_html=True)
st.title("🛰️ Satélite SpaceChat: Verificador")

API_KEY = "y04S2YI56Z8Rz8Xp05f6e87h66v98mS2"
terminos = st.text_input("Buscar:", "anime goku")

# --- CABECERA PARA EVITAR BLOQUEOS ---
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

if st.button("🚀 Verificar y Cargar"):
    url_api = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY}&q={terminos}&limit=10"
    
    try:
        # 1. Pedimos los datos a Giphy
        respuesta = requests.get(url_api, headers=headers).json()
        urls_verificadas = []
        
        cols = st.columns(3)
        idx = 0
        
        for item in respuesta['data']:
            url_gif = item['images']['fixed_height']['url']
            
            try:
                # 2. Verificamos con el nuevo Header y un timeout más largo
                chequeo = requests.get(url_gif, headers=headers, stream=True, timeout=10)
                
                if chequeo.status_code == 200:
                    urls_verificadas.append(url_gif)
                    with cols[idx % 3]:
                        st.image(url_gif)
                    idx += 1
                else:
                    st.warning(f"Salto: Código {chequeo.status_code}")
            except Exception as e:
                st.error(f"Fallo de red: {e}")

        # 3. Resultado final
        datos = {
            "stickers": urls_verificadas,
            "temas": [{"nombre": "Space Gold", "fondo": "#000000", "acento": "#ffd700"}]
        }
        
        st.success(f"✅ ¡Satélite activado! {len(urls_verificadas)} imágenes listas.")
        st.json(datos)
        
    except Exception as e:
        st.error(f"Error crítico: {e}")
