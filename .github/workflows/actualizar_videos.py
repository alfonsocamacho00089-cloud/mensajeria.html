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
            data = json.loads(response.read().decode())
            
        videos_limpios = []
        
        # Tomamos los primeros 5 videos y los dejamos relucientes para tu PWA
        for i, item in enumerate(data[:5]):
            video_limpio = {
                "id": f"py_vid_{int(datetime.now().timestamp())}_{i}",
                "sender_name": item.get("user", "Canal Automatizado"),
                "tipo": "video",
                "content": item.get("url", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"),
                "created_at": datetime.now().isoformat()
            }
            videos_limpios.append(video_limpio)
            
        # Guardamos el JSON final limpiecito
        with open("videos_feed.json", "w", encoding="utf-8") as f:
            json.dump(videos_limpios, f, ensure_ascii=False, indent=4)
            
        print("✅ ¡Archivo videos_feed.json generado con éxito por Python!")
        
    except Exception as e:
        print(f"❌ Error al procesar los videos: {e}")

if __name__ == "__main__":
    generar_feed_videos()
