import requests
import json

API_KEY = "y04S2YI56Z8Rz8Xp05f6e87h66v98mS2" # Tu API Key
TEMAS_BUSQUEDA = ["anime goku", "shinobu kocho"]

def verificar_tienda():
    print("🛰️ Iniciando verificacion...")
    datos_finales = {"stickers": [], "temas": []}

    for busqueda in TEMAS_BUSQUEDA:
        url = f"https://api.giphy.com/v1/gifs/search?api_key={API_KEY}&q={busqueda}&limit=15"
        res = requests.get(url).json()
        
        for item in res['data']:
            url_gif = item['images']['fixed_height']['url']
            try:
                # Solo guardamos si la imagen responde 200 OK
                if requests.head(url_gif, timeout=3).status_code == 200:
                    datos_finales["stickers"].append(url_gif)
            except:
                continue

    # Agregamos los temas Black & Gold
    datos_finales["temas"].append({
        "nombre": "Space Gold",
        "fondo": "#000000",
        "acento": "#ffd700"
    })

    with open('space_tienda.json', 'w') as f:
        json.dump(datos_finales, f, indent=4)
    print("✅ Archivo JSON actualizado.")

if __name__ == "__main__":
    verificar_tienda()
