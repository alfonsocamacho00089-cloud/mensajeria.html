// Función para generar el audio con ElevenLabs en Vercel
async function generarAudioTTS(texto) {
    const ELEVENLABS_API_KEY = "sk_161f372298f70bd20ff6ae30e9d01f4fe5b27c3c259e473d"; 
    const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; 
    
    try {
        // Cortamos el texto para no gastar de más tu cuota de ElevenLabs
        const textoSeguro = texto.slice(0, 180); 

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: textoSeguro,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("¡ERROR DE ELEVENLABS!:", errorData);
            return null;
        }     

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString("base64");

    } catch (error) {
        console.error("Error definitivo en ElevenLabs:", error);
        return null;
    }
}

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
                        inlineData: { mimeType: "audio/webm", data: base64Puro.trim() }
                    }]
                };
            }
            return mensaje;
        });

        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`;
        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S... (Tu prompt de siempre sin markdown)`; 
        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: historialFormateado,
                systemInstruction: { parts: [{ text: `${harvisPromptSystem}\n\nFECHA ACTUAL: ${fechaActual}.` }] },
                tools: [{ google_search: {} }, { codeExecution: {} }],
                generationConfig: { temperature: 0.75 }
            })
        });

        if (!respuestaServidor.ok) {
            const textoError = await respuestaServidor.text();
            return res.status(200).json({ respuesta: "Error en el servidor: " + textoError });
        }

        const datosGemini = await respuestaServidor.json();
        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas listos.";

        let respuestaFinal = { respuesta: respuestaIA };

        // Procesamos la voz con ElevenLabs de forma segura
        try {
            const audioBase64 = await generarAudioTTS(respuestaIA);
            if (audioBase64) {
                respuestaFinal.audioBase64 = audioBase64;
            }
        } catch (e) {
            console.error("Fallo al empaquetar audio:", e);
        }

        return res.status(200).json(respuestaFinal);

    } catch (error) {
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
                }
