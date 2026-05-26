// Usamos importación dinámica para evitar el error ERR_REQUIRE_ESM
async function getEdgeTTS() {
    const { EdgeTTS } = await import("edge-tts");
    return EdgeTTS;
}

// Modificamos tu función generarAudioTTS para que sea así:
// En tu api/chat.js
async function generarAudioTTS(texto) {
    // PEGA AQUÍ TU API KEY ENTRE LAS COMILLAS
    const ELEVENLABS_API_KEY = "sk_5a353527b37f2f0ef7f78b9b91a6a5824ea83e6a1901c2d8"; 
    // Cambia esta línea en tu función generarAudioTTS
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Esta es la voz 'Bella' (voz estándar gratuita)
    try {
        

 const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
            method: 'POST',
            headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: texto,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Detalle del error de ElevenLabs:", errorText);
            throw new Error("Error en ElevenLabs: " + response.statusText);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer).toString("base64");

    } catch (error) {
        console.error("Error definitivo en ElevenLabs:", error);
        return null;
    }
}

export default async function handler(req, res) { // <--- ESTO ESTABA EN TU LÍNEA 1
    // ... resto de tu código
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



        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`;

        

        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S.... (tu prompt completo aquí)`; 

        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


// Dentro de tu función en api/chat.js
const textoSeguro = texto.slice(0, 180); // ¡Corte radical a 180 caracteres!

// Y ahora usas textoSeguro para llamar a la API de ElevenLabs
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

        // --- INICIO DE TU LÓGICA CON LOS AGREGADOS ---
        console.log("¿Existe generarAudioTTS?:", typeof generarAudioTTS);

        if (typeof generarAudioTTS !== 'undefined') {
            try {
                console.log("Intentando generar audio para:", respuestaIA.substring(0, 20) + "...");
                respuestaFinal.audioBase64 = await generarAudioTTS(respuestaIA);
                console.log("Audio generado exitosamente.");
            } catch (e) {
                console.error("DETALLE DEL ERROR DE AUDIO:", e);
                respuestaFinal.errorAudio = e.message;
            }
        } else {
            console.warn("La función generarAudioTTS no está definida en este scope.");
        }
        // --- FIN DE LOS AGREGADOS ---

        return res.status(200).json(respuestaFinal);

    } catch (error) {
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
                }
