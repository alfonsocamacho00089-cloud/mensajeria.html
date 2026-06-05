import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

// Asegúrate de tener configurado tu servicio de Firebase en Vercel
// const serviceAccount = ... (tu lógica de conexión)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const { comando, datos } = req.body;
    const db = getDatabase();

    try {
        switch (comando) {
            case "NOTIFICAR_LIVE":
                // Envío directo a SpaxioFlow (ID: 26fmetp4Q4WJ)
                await db.ref('cola_satelital/26fmetp4Q4WJ').push({
                    p: Buffer.from(JSON.stringify(datos)).toString('base64'),
                    ts: Date.now(),
                    msgId: "live_" + Date.now()
                });
                return res.status(200).json({ status: "Live notificado" });

            case "NOTIFICAR_MENSAJE":
                // Cuando alguien te escribe a ti
                await db.ref('notificaciones_push/' + datos.receptorId).push({
                    titulo: "Nuevo mensaje",
                    cuerpo: datos.texto,
                    origen: datos.remitente
                });
                return res.status(200).json({ status: "Notificación enviada" });

            case "NOTIFICAR_LLAMADA":
                // Avisos de WebRTC de alta prioridad
                await db.ref('llamadas_entrantes/' + datos.receptorId).set({
                    de: datos.remitente,
                    room: datos.roomName,
                    ts: Date.now()
                });
                return res.status(200).json({ status: "Llamada notificada" });

            default:
                return res.status(400).json({ error: "Comando desconocido" });
        }
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
