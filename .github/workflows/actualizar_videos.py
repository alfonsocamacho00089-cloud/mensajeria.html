import json
import urllib.request
from datetime import datetime

def generar_feed_videos():
    url_api_publica = "https://gist.githubusercontent.com/pabloprieto/7f9e596b6d59b21f92e6/raw/ref.json"
    
    print("📡 Consultando API pública de videos...")
    try:
        req = urllib.request.Request(
            url_api_publica, 
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response:
            respuesta_texto = response.read().decode('utf-8')
            data = json.loads(respuesta_texto)
            
        print(f"📦 Se encontraron {len(data)} elementos en la API.")
        videos_limpios = []
        
        for i, item in enumerate(data[:5]):
            video_limpio = {
                "id": f"py_vid_{int(datetime.now().timestamp())}_{i}",
                "sender_name": item.get("user", "Canal Automatizado"),
                "tipo": "video",
                "content": item.get("url", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"),
                "created_at": datetime.now().isoformat()
            }
            videos_limpios.append(video_limpio)
            
        # Escribimos el JSON con los datos listos
        with open("videos_feed.json", "w", encoding="utf-8") as f:
            json.dump(videos_limpios, f, ensure_ascii=False, indent=4)
            
        print("✅ ¡Archivo videos_feed.json actualizado con éxito!")
        
    except Exception as e:
        print(f"❌ Error crítico procesando los videos: {e}")

if __name__ == "__main__":
    generar_feed_videos()
