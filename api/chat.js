export default async function handler(req, res) {
    // Cabeceras CORS para conectar con tu entorno móvil
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        // Recibimos el historial de la sesión y la llave dinámica de tu teléfono
        const { chatHistory, userKey } = req.body;
        const apiKey = userKey; 

        if (!apiKey || apiKey.trim() === "") {
            return res.status(200).json({ respuesta: "🔑 H.A.R.V.I.S.: Falta la clave local en el almacenamiento de su dispositivo." });
        }

        // =================================================================
        // TRADUCTOR MULTIMEDIA: Convertimos Base64 a Oídos Nativos de Google
        // =================================================================
        const historialFormateado = chatHistory.map(mensaje => {
            // Evaluamos solo los mensajes que tú envías
            if (mensaje.role === "user") {
                const contenidoTexto = mensaje.parts[0]?.text || "";

                // ¿Es un archivo de audio en Base64 de SpaceChat?
                if (contenidoTexto.includes("data:audio/webm;base64,") || contenidoTexto.startsWith("GkXf") || contenidoTexto.includes("base64,")) {
                    
                    // Extraemos limpiamente el Base64 puro quitando el encabezado "data:audio/...;base64,"
                    const partesData = contenidoTexto.split("base64,");
                    const base64Puro = partesData[1] || partesData[0];

                    // 🚀 Transformamos el mensaje en un bloque de datos binarios para Gemini
                    return {
                        role: "user",
                        parts: [{
                            inlineData: {
                                mimeType: "audio/webm", // Formato nativo de grabación móvil
                                data: base64Puro.trim()
                            }
                        }]
                    };
                }
            }
            // Si es texto normal tuyo o respuestas previas de H.A.R.V.I.S., se quedan idénticos
            return mensaje;
        });

        // =================================================================
        // CONEXIÓN CON GEMINI 2.5 FLASH (Misma URL y misma respuesta de siempre)
        // =================================================================
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, analítico y con un sutil toque de sarcasmo e ironía. Desarrolla tus ideas de forma completa, explicando en detalle cuando sea necesario, pero manteniendo la fluidez natural de una conversación.";

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: historialFormateado, // <── Pasamos el historial ya digerido con los audios listos
                systemInstruction: { parts: [{ text: harvisPromptSystem }] },
                generationConfig: { temperature: 0.75 }
            })
        });

        const datosGemini = await respuestaServidor.json();
        
        if (datosGemini.error) {
            return res.status(200).json({ 
                respuesta: `❌ GOOGLE API ERROR: [Código ${datosGemini.error.code}] - ${datosGemini.error.message}` 
            });
        }

        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content?.parts?.[0]?.text) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        // Devolvemos el texto con el formato exacto que tu front ya sabe pintar
        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(200).json({ respuesta: `💥 Fallo en la traducción central del audio: ${error.message}` });
    }
}
