const livekit = require('livekit-server-sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo permitido POST' });
  }

  const { roomName, identity, iniciarGrabacion } = req.body;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL || 'wss://space-xquv9iaa.livekit.cloud';

  try {
    // 1. Generamos el token de acceso WebRTC (Esto no puede fallar)
    const at = new livekit.AccessToken(apiKey, apiSecret, { identity: identity });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    // 2. Intentamos arrancar la grabación en un bloque aislado
    if (iniciarGrabacion) {
      try {
        const egressClient = new livekit.EgressClient(
          livekitUrl,
          apiKey,
          apiSecret
        );

        // Intentamos iniciar el empaquetado del archivo
        await egressClient.startRoomCompositeEgress(roomName, {
          file: {
            filepath: `lives/${roomName}-${Date.now()}.mp4`
          }
        });
        console.log(`🎥 Grabación solicitada en la nube para: ${roomName}`);
      } catch (egressError) {
        // Si LiveKit Cloud rechaza la grabación por falta de almacenamiento S3,
        // capturamos el error aquí para que NO tumbe toda la API.
        console.error("⚠️ LiveKit Cloud rechazó la grabación directa, pero el live continuará:", egressError.message);
      }
    }

    // 3. Siempre respondemos con JSON pase lo que pase con la grabación
    return res.status(200).json({ token: token });

  } catch (err) {
    console.error("❌ Error fatal en la API:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
