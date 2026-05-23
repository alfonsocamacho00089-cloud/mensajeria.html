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
        const historialFormateado = chatHistory.map(mensaje => {
    // Si es audio, lo formateamos estrictamente como Google pide
    if (mensaje.role === "user" && mensaje.parts[0]?.text && 
        (mensaje.parts[0].text.includes("base64,") || mensaje.parts[0].text.startsWith("GkXf"))) {
        
        const partesData = mensaje.parts[0].text.split("base64,");
        const base64Puro = partesData[1] || partesData[0];

        // ESTRUCTURA BLINDADA PARA GEMINI
        return {
            role: "user",
            parts: [{
                inlineData: {
                    mimeType: "audio/webm",
                    data: base64Puro.trim()
                }
            }]
        };
    }
    // Si es texto, pasa normal
    return mensaje;
});

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
