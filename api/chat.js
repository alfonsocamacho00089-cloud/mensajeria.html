export default async function handler(req, res) {
    // Configurar cabeceras para evitar bloqueos de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { msg } = req.body;
        // Vercel tomará la API KEY de sus variables ocultas del sistema
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return res.status(500).json({ error: 'Falta la configuración del servidor.' });
        }

        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, conciso y con un sutil toque de sarcasmo e ironía. Respuestas cortas.";

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: msg }] }],
                systemInstruction: { parts: [{ text: harvisPromptSystem }] },
                generationConfig: { temperature: 0.75 }
            })
        });

        const datosGemini = await respuestaServidor.json();
        
        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(500).json({ error: 'Fallo en la conexión central.' });
    }
}
