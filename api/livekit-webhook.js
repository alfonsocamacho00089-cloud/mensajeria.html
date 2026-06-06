import { WebhookReceiver } from 'livekit-server-sdk';
import axios from 'axios';

// Asegura que las peticiones vengan directo de LiveKit Cloud usando tus llaves
const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

export default async function handler(req, res) {
  // Solo aceptamos peticiones POST de los servidores de LiveKit
  if (req.method !== 'POST') return res.status(405).end();

  try {
    // 1. Validamos la firma de seguridad del webhook
    const event = receiver.receive(req.body, req.headers.authorization);
    
    // 2. Escuchamos el evento exacto cuando la grabación en la nube termina
    if (event.event === 'EGRESS_ENDED' && event.egressInfo.file?.downloadUrl) {
      const videoUrl = event.egressInfo.file.downloadUrl;
      const roomName = event.egressInfo.roomName; // El ID del usuario que transmitió

      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      // 3. Despachamos el video directo a tu canal de Telegram
      const tgResponse = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, {
        chat_id: chatId,
        video: videoUrl,
        caption: `🎬 **SpaxioLive Guardado**\n👤 Transmisión de: \`${roomName}\`\n📅 Fecha: ${new Date().toLocaleString()}`,
        parse_mode: 'Markdown'
      });

      // 4. Capturamos el File ID único de los servidores de Telegram
      const telegramFileId = tgResponse.data.result.video.file_id;
      console.log("🚀 ¡Video en la nube de Telegram! File ID:", telegramFileId);

      // ============================================================
      // 🔥 AQUÍ AGREGAS TU GUARDA EN FIREBASE REALTIME DATABASE:
      // Guarda este 'telegramFileId' bajo el nodo del usuario para que 
      // cuando alguien entre a su perfil o feed, se reproduzca el video.
      // ============================================================
    }

    // Le respondemos 200 OK a LiveKit para que sepa que recibimos el paquete
    return res.status(200).json({ status: "success" });

  } catch (error) {
    console.error("❌ Error en Webhook de LiveKit:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
