const livekit = require('livekit-server-sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo permitido POST' });
  }

  // Capturamos 'iniciarGrabacion' que viene desde tu frontend
  const { roomName, identity, iniciarGrabacion } = req.body;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;

  try {
    // 1. Generamos el token de acceso WebRTC normal para transmitir
    const at = new livekit.AccessToken(apiKey, apiSecret, { identity: identity });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    // 2. 🔥 EL CAMBIO CLAVE: Si eres tú iniciando el directo, encendemos la grabación en la nube
    if (iniciarGrabacion) {
      const egressClient = new livekit.EgressClient(
        livekitUrl,
        apiKey,
        apiSecret
      );

      // Le ordenamos a LiveKit Cloud que empiece a empaquetar el directo en un MP4
      await egressClient.startRoomCompositeEgress(roomName, {
        file: {
          filepath: `lives/${roomName}-${Date.now()}.mp4`,
        }
      });
      console.log(`🎥 Grabación en la nube iniciada para el directo de: ${roomName}`);
    }

    // Devolvemos el token al teléfono para abrir la cámara
    res.status(200).json({ token: token });
  } catch (err) {
    console.error("❌ Error generando token/grabación:", err.message);
    res.status(500).json({ error: err.message });
  }
};
