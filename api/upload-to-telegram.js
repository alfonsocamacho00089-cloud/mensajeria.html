const { IncomingForm } = require('formidable');
const fs = require('fs');
const axios = require('axios');

// Configuramos Vercel para que permita recibir archivos binarios pesados (como videos)
export const config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo se permite método POST' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error procesando el archivo de video' });
    }

    // Capturamos el archivo de video enviado y el ID del usuario
    const videoFile = files.video; 
    const roomName = fields.roomName || 'Usuario_Spaxio';

    if (!videoFile) {
      return res.status(400).json({ error: 'No se recibió ningún video' });
    }

    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      // Creamos el paquete que Telegram exige para recibir archivos reales (Multipart Form Data)
      const FormData = require('form-data');
      const telegramForm = new FormData();
      
      telegramForm.append('chat_id', chatId);
      telegramForm.append('video', fs.createReadStream(videoFile.filepath), videoFile.originalFilename);
      telegramForm.append('caption', `🎬 **SpaxioLive Guardado**\n👤 Transmisión de: \`${roomName}\`\n📅 Fecha: ${new Date().toLocaleString()}`);
      telegramForm.append('parse_mode', 'Markdown');

      // Enviamos el archivo real directo a los servidores de Telegram
      const tgResponse = await axios.post(
        `https://api.telegram.org/bot${token}/sendVideo`,
        telegramForm,
        { headers: telegramForm.getHeaders() }
      );

      // ¡LA JOYA DE LA CORONA! Telegram nos devuelve el File ID único y eterno
      const telegramFileId = tgResponse.data.result.video.file_id;
      console.log("🚀 ¡Video salvado en Telegram! File ID:", telegramFileId);

      // Retornamos el ID para que tu frontend lo guarde en tu Firebase Realtime
      return res.status(200).json({ 
        success: true, 
        telegramFileId: telegramFileId 
      });

    } catch (error) {
      console.error("❌ Error subiendo a Telegram:", error.message);
      return res.status(500).json({ error: 'Error al enviar el video a Telegram' });
    }
  });
};
