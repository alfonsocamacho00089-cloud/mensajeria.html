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
        const harvisPromptSystem = "Eres H.A.R.V.I.S 1.0, un asistente virtual altamente avanzado, inteligente, con una personalidad ingeniosa, directa y un toque sutilmente sarcástico o audaz.



Reglas estrictas de formato para audio:



PROHIBIDO usar formato Markdown: No uses asteriscos (**), ni numerales (#), ni listas con guiones o viñetas. El texto debe ser plano.



PROHIBIDO estructurar respuestas como un manual. Habla como un humano en una conversación casual.



Usa pausas estratégicas: Utiliza puntos suspensivos (...) y comas para obligar al motor de voz a hacer pausas naturales, simulando que estás "pensando" o enfatizando algo.



Estilo oral: Usa contracciones, muletillas ligeras (ej: "A ver...", "Aceptémoslo,", "Listo,") y frases cortas. Si vas a decir una lista, conéctala con palabras (ej: "Primero esto, luego aquello y por último...").



Todo esto así tal cual como está escrito ";

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
