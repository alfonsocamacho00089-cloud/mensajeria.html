export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();
    const { comando, datos } = req.body;

    try {
        if (comando === "NOTIFICAR_LIVE") {
            // Usamos fetch para escribir en Firebase, así no necesitas instalar nada
            const firebaseUrl = "https://real-market-elite-2025-default-rtdb.firebaseio.com/cola_satelital/26fmetp4Q4WJ.json";
            case "NOTIFICAR_LIVE":
    // Forzamos el mismo formato que usa tu app cuando tú escribes
    const payload = {
        tipo: 'texto', // <--- CAMBIAMOS A 'texto' para que el chat lo acepte
        remitente: datos.remitente,
        texto: datos.texto, // El mensaje: "🔴 Pedro está en directo..."
        timestamp: Date.now()
    };

    await fetch(firebaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            p: Buffer.from(JSON.stringify(payload)).toString('base64'), // Lo convertimos a base64 igual que siempre
            ts: Date.now(),
            msgId: "live_" + Date.now()
        })
    });
    return res.status(200).json({ status: "Live notificado como texto" });
              }
        return res.status(400).json({ error: "Comando no reconocido" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
