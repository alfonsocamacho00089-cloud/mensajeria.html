// api/spaxioverso/coordenadas.js
export default async function handler(req, res) {
    // Forzamos que solo acepte peticiones POST ligeras
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { idSala, idUsuario, x, y } = req.body;

        // Validación rápida de seguridad para proteger los hilos del servidor
        if (!idSala || !idUsuario) {
            return res.status(400).json({ error: 'Datos incompletos para el Spaxioverso' });
        }

        // Aquí la API de Vercel procesa la carga útil antes de distribuirla
        return res.status(200).json({
            success: true,
            status: "coordenadas_validadas",
            ts: Date.now()
        });

    } catch (error) {
        console.error("❌ Error en la API del Spaxioverso:", error);
        return res.status(500).json({ error: 'Error interno en los hilos de Vercel' });
    }
}
