import streamlit as st
import requests

# Configuración estética Black & Gold
st.set_page_config(page_title="Space Tienda Pro", layout="wide")
st.markdown("""
    <style>
    .main { background-color: #000000; color: #ffd700; }
    .stButton>button { background-color: #ffd700; color: black; border-radius: 20px; width: 100%; }
    stImage > img { border: 2px solid #ffd700; border-radius: 10px; }
    </style>
    """, unsafe_allow_html=True)

# --- CONFIGURACIÓN ---
# Usamos tu nueva llave que ya dio código 200
API_KEY = "8qg9l4A2jlKfefipSwIIK3Tt6XvdJxfD" 

def buscar_giphy(tipo, query, limite=5):
    url = f"https://api.giphy.com/v1/{tipo}/search?api_key={API_KEY}&q={query}&limit={limite}"
    try:
        res = requests.get(url).json()
        return [item['images']['fixed_height']['url'] for item in res['data']]
    except:
        return []

st.title("🛰️ Satélite SpaceChat: Tienda Inteligente")

# Buscador principal
query_inicial = st.text_input("¿Qué quieres buscar hoy? (Ej: Batman, Naruto, Tech)", "Cyberpunk")

# Inicializamos el estado si no existe
if 'tema_seleccionado' not in st.session_state:
    st.session_state.tema_seleccionado = query_inicial

if st.button("🚀 Explorar Tienda"):
    st.session_state.tema_seleccionado = query_inicial

# --- MOSTRAR RESULTADOS ---
tema = st.session_state.tema_seleccionado
st.subheader(f"Mostrando adelanto de: {tema}")

col1, col2 = st.columns(2)

# Columna 1: 5 GIFs
with col1:
    st.markdown("### 🎬 GIFs")
    gifs = buscar_giphy("gifs", tema, 5)
    for g in gifs:
        st.image(g, use_column_width=True)
        if st.button(f"Ver más GIFs de {tema}", key=f"btn_{g}"):
            st.session_state.ver_mas = ("gifs", tema)

# Columna 2: 5 Stickers
with col2:
    st.markdown("### ✨ Stickers")
    stickers = buscar_giphy("stickers", tema, 5)
    for s in stickers:
        st.image(s, use_column_width=True)
        if st.button(f"Ver más Stickers de {tema}", key=f"btn_{s}"):
            st.session_state.ver_mas = ("stickers", tema)

# --- SECCIÓN "VER MÁS" (Se activa al tocar un botón) ---
if 'ver_mas' in st.session_state:
    tipo_extra, tema_extra = st.session_state.ver_mas
    st.divider()
    st.header(f"🔥 Colección Completa: {tema_extra}")
    
    extra_data = buscar_giphy(tipo_extra, tema_extra, 20)
    cols_extra = st.columns(4)
    
    for i, url_extra in enumerate(extra_data):
        with cols_extra[i % 4]:
            st.image(url_extra)

# Generar JSON final para SpaceChat
# --- CORRECCIÓN DEL FINAL DEL CÓDIGO ---

if st.button("📦 Generar JSON para la App"):
    final_gifs = buscar_giphy("gifs", tema, 10)
    final_stickers = buscar_giphy("stickers", tema, 10)
    
    # Esta es la variable correcta
    archivo_final = {
        "stickers": final_stickers,
        "gifs": final_gifs,
        "temas": [
            {"nombre": "Space Gold", "fondo": "#000000", "acento": "#ffd700"}
        ]
    }
    
    # Mostramos el contenido de la variable 'archivo_final'
    # Usamos st.json para que se vea ordenado
    st.json(archivo_final)
