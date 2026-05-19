export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Falta el prompt para la imagen.' });
        }

        // Limpiamos el texto quitando palabras de acción para que la IA dibuje mejor
        const promptLimpio = encodeURIComponent(prompt.replace(/(genera|hazme|crea|una|imagen|dibuja|por|favor|de)/gi, "").trim());
        
        // Motor de IA generativa de arte digital veloz y gratuito
        const urlImagenGenerada = `https://image.pollinations.ai/p/${promptLimpio}?width=512&height=512&seed=${Date.now()}&nologo=true`;

        // Respuestas cortas y con la personalidad de H.A.R.V.I.S.
        const frasesArtista = [
            "Entendido, señor Peres. Activando mis subrutinas artísticas en Nano-Banano. Contemple el resultado:",
            "Procesando sus órdenes visuales, Pedro. He renderizado su petición de inmediato:",
            "H.A.R.V.I.S. 1.0 modo artista online. Aquí tiene el diseño solicitado:"
        ];
        const respuestaSarcastica = frasesArtista[Math.floor(Math.random() * frasesArtista.length)];

        return res.status(200).json({ 
            respuesta: respuestaSarcastica,
            imagenUrl: urlImagenGenerada 
        });

    } catch (error) {
        return res.status(500).json({ error: 'Error en el procesador de imágenes.' });
    }
}
