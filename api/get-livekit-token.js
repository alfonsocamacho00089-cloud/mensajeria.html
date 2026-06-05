const livekit = require('livekit-server-sdk');

export default async function handler(req, res) {
  // Respondemos inmediatamente con texto plano para ver si el navegador lo recibe
  res.status(200).json({ status: "ok", message: "Conexión recibida correctamente" });
}

  const { roomName, identity } = req.body;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  try {
    const at = new livekit.AccessToken(apiKey, apiSecret, { identity: identity });
    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
