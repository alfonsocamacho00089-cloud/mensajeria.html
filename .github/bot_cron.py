import os
import requests
import json
import time

# ==============================================================================
# 1. CONFIGURACIÓN DE PRUEBA E INYECCIÓN DIRECTA
# ==============================================================================

# URL de tu endpoint backend en Vercel (ajusta la URL según tu dominio real)
URL_API_VERCEL = "https://tu-app-spaxio.vercel.app/api/spaxioflow-event" 
TOKEN_BOT = "8317000492:AAHBidIMBFqAdH4t4GufKzeTfiF7TmJuhts"
MI_CHAT_ID = "8320121552"
# Token de tu Bot de Telegram
TELEGRAM_BOT_TOKEN = os.environ.get("8317000492:AAHBidIMBFqAdH4t4GufKzeTfiF7TmJuhts", "8320121552)

# ==============================================================================
# 2. CONFIGURACIÓN DE SUPABASE (LISTA PARA DESCOMENTAR LUEGO)
# ==============================================================================
"""
# Para cuando conectes Supabase, descomenta este bloque e instala `supabase` (pip install supabase)
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://fcklnjgkwrnunoroseze.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "TU_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
"""

# ==============================================================================
# 3. FUNCIÓN DE PRUEBA: INYECCIÓN DIRECTA A SPAXIOFLOW (VERCEL)
# ==============================================================================
def probar_inyeccion_directa():
    print("🚀 Iniciando prueba de inyección directa a SpaxioFlow...")

    # Datos de prueba con una imagen real para verificar visualmente en la PWA
    datos_prueba = {
        "contenido": "https://picsum.photos/600/400?random=" + str(int(time.time())),
        "tipoEvento": "imagen",
        "remitente": "Spaxio Bot 🤖",
        "sender_id": "bot_auto_001",
        "user_id": "bot_auto_001",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    try:
        respuesta = requests.post(
            URL_API_VERCEL,
            headers={"Content-Type": "application/json"},
            data=json.dumps(datos_prueba),
            timeout=10
        )
        
        if respuesta.status_code == 200:
            print("✅ ¡Inyección exitosa! El contenido ya fue publicado en SpaxioFlow.")
            print("Respuesta del servidor:", respuesta.json())
        else:
            print(f"⚠️ Error en el servidor (Código {respuesta.status_code}):", respuesta.text)

    except Exception as e:
        print("❌ Fallo crítico al conectar con Vercel:", str(e))

# ==============================================================================
# 4. FUNCIÓN DE SUPABASE (LISTA PARA USAR LUEGO)
# ==============================================================================
def publicar_en_supabase(url_contenido, tipo="imagen", nombre_bot="Spaxio Bot 🤖"):
    """
    Descomenta este código cuando vayas a conectar Supabase directamente:
    
    datos_post = {
        "chat_id": "26fmetp4Q4WJ", # ID fijo de SpaxioFlow
        "sender_id": "bot_auto_001",
        "sender_name": nombre_bot,
        "content": url_contenido,
        "tipo": tipo
    }
    
    res = supabase.table("spaxioflow_feed").insert(datos_post).execute()
    print("✅ Insertado en Supabase con éxito:", res)
    """
    pass

# ==============================================================================
# PUNTO DE ENTRADA
# ==============================================================================
if __name__ == "__main__":
    # Ejecutamos primero la prueba directa
    probar_inyeccion_directa()
