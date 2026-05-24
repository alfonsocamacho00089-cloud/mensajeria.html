export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory, userKey } = req.body;

        const historialFormateado = chatHistory.map(mensaje => {
            if (mensaje.role === "user" && mensaje.parts[0]?.text && 
                (mensaje.parts[0].text.includes("base64,") || mensaje.parts[0].text.startsWith("GkXf"))) {
                
                const partesData = mensaje.parts[0].text.split("base64,");
                const base64Puro = partesData[1] || partesData[0];

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
            return mensaje;
        });

        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${userKey}`;
        
        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S.... (tu prompt completo aquí)`; 
        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: historialFormateado,
                systemInstruction: { 
                    parts: [{ text: `${harvisPromptSystem}\n\nFECHA ACTUAL: ${fechaActual}.` }] 
                },
                tools: [{ google_search: {} }, { codeExecution: {} }],
                generationConfig: { temperature: 0.75 }
            })
        });

        if (!respuestaServidor.ok) {
            const textoError = await respuestaServidor.text();
            return res.status(200).json({ respuesta: "Error en el servidor: " + textoError });
        }

        const datosGemini = await respuestaServidor.json();
        
        if (datosGemini.error) {
            return res.status(200).json({ respuesta: `Error API: ${datosGemini.error.message}` });
        }

        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas listos.";
        
        let respuestaFinal = { respuesta: respuestaIA };
        
        // Solo intenta generar audio si la función existe
        if (typeof generarAudioTTS !== 'undefined') {
            try {
                respuestaFinal.audioBase64 = await generarAudioTTS(respuestaIA);
            } catch (e) {
                console.error("No se pudo generar el audio.");
            }
        }

        return res.status(200).json(respuestaFinal);

    } catch (error) {
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
}
