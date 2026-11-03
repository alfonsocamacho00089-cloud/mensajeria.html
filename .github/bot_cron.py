import os
import requests
import json
import time
import random

# URL de tu endpoint backend en Vercel
URL_API_VERCEL = "https://dropis-chat.vercel.app/api/spaxioflow-event" 

# Lista de videos de demostración públicos y estables (puedes cambiarlos por los que quieras)
VIDEOS_EJEMPLO = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
]

def generar_contenido_multimedia():
    print("🛰️ Generando contenido multimedia fresco para SpaxioFlow...")
    
    # Decidimos al azar si toca una "imagen" (70% de probabilidad) o un "video" (30% de probabilidad)
    tipo_elegido = random.choices(["imagen", "video"], weights=[70, 30], k=1)[0]
    
    if tipo_elegido == "imagen":
        # Genera una imagen aleatoria nueva
        random_id = random.randint(100, 9999)
        contenido_url = f"https://picsum.photos/seed/{random_id}/800/1000"
        tipo_evento = "imagen"
        print("📸 Contenido seleccionado: Imagen aleatoria")
    else:
        # Selecciona un video aleatorio de la lista
        contenido_url = random.choice(VIDEOS_EJEMPLO)
        tipo_evento = "video"
        print("🎥 Contenido seleccionado: Video en bucle")

    # Preparamos el paquete de datos para tu PWA en Vercel
    datos_publicacion = {
        "contenido": contenido_url,
        "tipoEvento": tipo_evento,
        "remitente": "Spaxio AutoBot 🤖",
        "sender_id": "bot_multimedia_system",
        "user_id": "bot_multimedia_system",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    try:
        # Enviamos el contenido al backend de tu app
        respuesta = requests.post(
            URL_API_VERCEL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(datos_publicacion),
            timeout=15
        )
        
        if respuesta.status_code == 200:
            print(f"✅ ¡{tipo_evento.capitalize()} inyectado con éxito en SpaxioFlow!")
            print("Respuesta de Vercel:", respuesta.json())
        else:
            print(f"⚠️ Error en el servidor (Código {respuesta.status_code}):", respuesta.text)

    except Exception as e:
        print("❌ Fallo de red al conectar con Vercel:", str(e))

if __name__ == "__main__":
    generar_contenido_multimedia()
