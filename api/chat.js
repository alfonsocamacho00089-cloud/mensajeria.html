export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory, userKey } = req.body;
        const apiKey = userKey;

        // 1. PROCESAMIENTO INTELIGENTE DEL HISTORIAL
        const historialFormateado = await Promise.all(chatHistory.map(async (msg) => {
            if (msg.role === "user" && msg.parts[0]?.text && 
               (msg.parts[0].text.includes("base64,") || msg.parts[0].text.startsWith("GkXf"))) {
                
                // Si ya tiene fileData, no procesar (ahorro de tokens)
                if (msg.parts[0].fileData) return msg;

                // Subir a Google File API
                const subida = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file: { mimeType: 'audio/webm', displayName: 'audio_sesion' } })
                });
                const datos = await subida.json();

                // RETORNO CON TEXTO Y ARCHIVO: Esto evita que tu App se quede en blanco
                return { 
                    role: "user", 
                    parts: [
                        { text: "Audio procesado" }, 
                        { fileData: { mimeType: "audio/webm", fileUri: datos.file.uri } }
                    ] 
                };
            }
            return msg;
        }));

        // 2. LLAMADA A GEMINI (Usando el historial limpio)
        const respuestaServidor = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: historialFormateado,
                systemInstruction: { parts: [{ text: "Eres H.A.R.V.I.S...." }] }, // Pon aquí tu prompt
                generationConfig: { temperature: 0.75 }
            })
        });

        const datosGemini = await respuestaServidor.json();
        
        // 3. RESPUESTA SEGURA (Blindaje contra errores de texto plano)
        if (datosGemini.error) {
            return res.status(200).json({ respuesta: `Error API: ${datosGemini.error.message}` });
        }

        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas listos.";
        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        // CUALQUIER error se convierte en JSON para que tu app móvil no explote
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
}
