// Cambia la primera línea por esto:
const livekit = require('livekit-server-sdk');
const AccessToken = livekit.AccessToken;
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo permitido POST' });
  }

  const { roomName, identity } = req.body;

  // Vercel lee automáticamente las llaves que pusiste en Environment Variables
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Faltan credenciales de LiveKit en Vercel' });
  }

  const at = new AccessToken(apiKey, apiSecret, { identity: identity });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();
  res.status(200).json({ token });
}
