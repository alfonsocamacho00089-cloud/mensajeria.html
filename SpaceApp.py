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

# --- CONFIGURACIÓN DE CONEXIÓN ---
TOKEN_GITHUB = st.secrets["GIPHUP_TOKEN"]
USUARIO = "alfonsocamacho00089-cloud"
REPO = "mensajeria.html"
RUTA_ARCHIVO = "tienda_space.json"
API_KEY_GIPHY = "8qg9l4A2jlKfefipSwIIK3Tt6XvdJxfD" 

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
    res_get = requests.get(url, headers=headers)
    sha = res_get.json().get('sha') if res_get.status_code == 200 else None
    contenido_b64 = base64.b64encode(json.dumps(datos_json, indent=4).encode()).decode()
    payload = {
        "message": "🛰️ Actualización automática desde Satélite SpaceChat",
        "content": contenido_b64,
        "sha": sha
    }
    return requests.put(url, headers=headers, json=payload).status_code

# --- INTERFAZ PRINCIPAL ---
st.title("🛰️ Satélite SpaceChat: Tienda Inteligente")

query_inicial = st.text_input("¿Qué quieres buscar hoy?", "Cyberpunk")

if 'tema_seleccionado' not in st.session_state:
    st.session_state.tema_seleccionado = query_inicial

if st.button("🚀 Explorar Tienda"):
    st.session_state.tema_seleccionado = query_inicial
    if 'ver_mas' in st.session_state: del st.session_state.ver_mas # Limpiar vista extra al buscar nuevo

tema = st.session_state.tema_seleccionado
st.subheader(f"Mostrando adelanto de: {tema}")

col1, col2 = st.columns(2)

# --- TU LÓGICA ORIGINAL DE COLUMNAS ---
with col1:
    st.markdown("### 🎬 GIFs")
    gifs_adelanto = buscar_giphy("gifs", tema, 5)
    for g in gifs_adelanto:
        st.image(g, use_column_width=True)
    if st.button(f"Ver más GIFs de {tema}"):
        st.session_state.ver_mas = ("gifs", tema)

with col2:
    st.markdown("### ✨ Stickers")
    stickers_adelanto = buscar_giphy("stickers", tema, 5)
    for s in stickers_adelanto:
        st.image(s, use_column_width=True)
    if st.button(f"Ver más Stickers de {tema}"):
        st.session_state.ver_mas = ("stickers", tema)

# --- SECCIÓN "VER MÁS" (Tal cual la pediste) ---
if 'ver_mas' in st.session_state:
    tipo_extra, tema_extra = st.session_state.ver_mas
    st.divider()
    st.header(f"🔥 Colección Completa: {tema_extra}")
    
    extra_data = buscar_giphy(tipo_extra, tema_extra, 20)
    cols_extra = st.columns(4)
    
    for i, url_extra in enumerate(extra_data):
        with cols_extra[i % 4]:
            st.image(url_extra)

# --- BOTÓN FINAL DE PUBLICACIÓN ---
st.divider()
if st.button("🚀 PUBLICAR TODO EN GITHUB"):
    with st.spinner("Subiendo archivos a SpaceChat..."):
        # Buscamos 15 de cada uno para que el JSON de la tienda sea bien pesado y completo
        paquete_datos = {
            "stickers": buscar_giphy("stickers", tema, 15), 
            "gifs": buscar_giphy("gifs", tema, 15),
            "temas": [{"nombre": "Space Gold", "fondo": "#000000", "acento": "#ffd700"}]
        }
        
        resultado = enviar_a_github(paquete_datos)
        if resultado in [200, 201]:
            st.success("✅ ¡Publicado! tienda_space.json actualizado.")
            st.balloons()
        else:
            st.error(f"Error {resultado}. Revisa tus credenciales.")

