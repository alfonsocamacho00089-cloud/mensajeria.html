import streamlit as st
import requests
import base64
import json

# --- CONFIGURACIÓN ESTÉTICA BLACK & GOLD ---
st.set_page_config(page_title="Space Tienda Pro", layout="wide")
st.markdown("""
    <style>
    .main { background-color: #000000; color: #ffd700; }
    .stButton>button { background-color: #ffd700; color: black; border-radius: 20px; width: 100%; }
    stImage > img { border: 2px solid #ffd700; border-radius: 10px; }
    </style>
    """, unsafe_allow_html=True)

# --- LLAMADA SEGURA A SECRETOS ---
# Asegúrate de que en Streamlit Secrets escribiste: GIPHUP_TOKEN = "tu_token..."
TOKEN_GITHUB = st.secrets["GIPHUP_TOKEN"]
USUARIO = "alfonsocamacho00089-cloud"  # <--- CAMBIA ESTO POR TU USUARIO REAL
REPO = "mensajeria.html" # <--- CAMBIA ESTO POR TU REPO REAL
RUTA_ARCHIVO = "tienda_space.json"
API_KEY_GIPHY = "8qg9l4A2jlKfefipSwIIK3Tt6XvdJxfD" 

# --- FUNCIONES DE LÓGICA ---
def buscar_giphy(tipo, query, limite=5):
    url = f"https://api.giphy.com/v1/{tipo}/search?api_key={API_KEY_GIPHY}&q={query}&limit={limite}"
    try:
        res = requests.get(url).json()
        return [item['images']['fixed_height']['url'] for item in res['data']]
    except:
        return []

def enviar_a_github(datos_json):
    url = f"https://api.github.com/repos/{USUARIO}/{REPO}/contents/{RUTA_ARCHIVO}"
    headers = {
        "Authorization": f"token {TOKEN_GITHUB}",
        "Accept": "application/vnd.github.v3+json"
    }
    # 1. Obtener el SHA si el archivo ya existe
    res_get = requests.get(url, headers=headers)
    sha = res_get.json().get('sha') if res_get.status_code == 200 else None

    # 2. Preparar el contenido
    contenido_b64 = base64.b64encode(json.dumps(datos_json, indent=4).encode()).decode()
    payload = {
        "message": "🛰️ Actualización automática desde Satélite SpaceChat",
        "content": contenido_b64,
        "sha": sha
    }
    # 3. Subir
    res_put = requests.put(url, headers=headers, json=payload)
    return res_put.status_code

# --- INTERFAZ DE USUARIO ---
st.title("🛰️ Satélite SpaceChat: Tienda Inteligente")

query_inicial = st.text_input("¿Qué quieres buscar hoy?", "Cyberpunk")

if 'tema_seleccionado' not in st.session_state:
    st.session_state.tema_seleccionado = query_inicial

if st.button("🚀 Explorar Tienda"):
    st.session_state.tema_seleccionado = query_inicial

tema = st.session_state.tema_seleccionado
st.subheader(f"Mostrando adelanto de: {tema}")

col1, col2 = st.columns(2)
with col1:
    st.markdown("### 🎬 GIFs")
    gifs = buscar_giphy("gifs", tema, 5)
    for g in gifs: st.image(g, use_column_width=True)

with col2:
    st.markdown("### ✨ Stickers")
    stickers = buscar_giphy("stickers", tema, 5)
    for s in stickers: st.image(s, use_column_width=True)

# --- BOTÓN DE LANZAMIENTO A GITHUB ---
st.divider()
if st.button("🚀 PUBLICAR TIENDA EN GITHUB"):
    # Recopilamos datos frescos antes de enviar
    paquete_datos = {
        "stickers": buscar_giphy("stickers", tema, 10), 
        "gifs": buscar_giphy("gifs", tema, 10),
        "temas": [{"nombre": "Space Gold", "fondo": "#000000", "acento": "#ffd700"}]
    }
    
    with st.spinner("Sincronizando con YouSpace..."):
        resultado = enviar_a_github(paquete_datos)
        if resultado in [200, 201]:
            st.success(f"✅ ¡ÉXITO! '{RUTA_ARCHIVO}' actualizado en tu repositorio.")
            st.balloons()
        else:
            st.error(f"❌ Error {resultado}. Revisa que el nombre del usuario y repo sean correctos.")
