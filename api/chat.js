import fetch from 'node-fetch'; // Asegúrate de tenerlo en tus dependencies si estás en un entorno Node clásico de Vercel, o quítalo si usas las funciones nativas más recientes.

// Función para generar el audio con ElevenLabs en Vercel
async function generarAudioTTS(texto) {
    const ELEVENLABS_API_KEY = "sk_161f372298f70bd20ff6ae30e9d01f4fe5b27c3c259e473d"; 
    const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; 
    
    try {
        // --- AQUÍ ESTÁ EL CHIVATO ---
        console.log("--------------------------------------------------");
        console.log("DEBUG: Tamaño del texto antes de ElevenLabs:", texto?.length || 0);
        console.log("DEBUG: Contenido del texto:", texto);
        console.log("DEBUG: Tipo de mensaje (tipo):", typeof tipo !== 'undefined' ? tipo : 'No definido'); 

        // Chivato de detección: Te avisa de inmediato si pasará el filtro de la burbuja
        const testCosaNueva = texto?.includes('youtube.com/') || texto?.includes('youtu.be/') || 
                              texto?.includes('tiktok.com/') || texto?.includes('facebook.com/') || 
                              (typeof tipo !== 'undefined' && (tipo === 'video' || tipo === 'audio')) || 
                              texto?.startsWith('blob:') || texto?.startsWith('data:audio');
        console.log("DEBUG: ¿Pasará el filtro de CosaNueva (Audio/Video/Blob)?:", testCosaNueva ? "✅ SÍ" : "❌ NO (Se pintará como texto común)");
        console.log("--------------------------------------------------");

        if (!texto) return null;

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
    // Configuración de Cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory, userKey } = req.body;

        if (!userKey) {
            return res.status(200).json({ respuesta: "Error: Falta la API Key de Gemini (userKey)." });
        }

        // --- FORMATEADOR MULTIMODAL AVANZADO ---
        // Detecta audios, imágenes y videos incrustados en el historial en formato Base64 o binarios crudos.
        const historialFormateado = chatHistory.map(mensaje => {
            if (mensaje.role === "user" && mensaje.parts?.[0]?.text) {
                const textoEntrada = mensaje.parts[0].text;

                // 1. Detección y mapeo de Audio
                if (textoEntrada.includes("base64,") && textoEntrada.includes("audio/")) {
                    const partesData = textoEntrada.split("base64,");
                    const mimeType = textoEntrada.match(/data:(audio\/.*?);/)?.[1] || "audio/webm";
                    return {
                        role: "user",
                        parts: [{ inlineData: { mimeType: mimeType, data: partesData[1].trim() } }]
                    };
                }
                if (textoEntrada.startsWith("GkXf")) { // Cabecera común de archivos WebM de audio
                    return {
                        role: "user",
                        parts: [{ inlineData: { mimeType: "audio/webm", data: textoEntrada.trim() } }]
                    };
                }

                // 2. Detección y mapeo de Imágenes (Formatos comunes)
                if (textoEntrada.includes("base64,") && textoEntrada.includes("image/")) {
                    const partesData = textoEntrada.split("base64,");
                    const mimeType = textoEntrada.match(/data:(image\/.*?);/)?.[1] || "image/jpeg";
                    return {
                        role: "user",
                        parts: [{ inlineData: { mimeType: mimeType, data: partesData[1].trim() } }]
                    };
                }
                
                // Enfoque alternativo: si detecta cabeceras base64 puras de imágenes comunes sin prefijo data:
                if (textoEntrada.startsWith("/9j/")) { // JPEG
                    return {
                        role: "user",
                        parts: [{ inlineData: { mimeType: "image/jpeg", data: textoEntrada.trim() } }]
                    };
                }
                if (textoEntrada.startsWith("iVBORw0KGgo=")) { // PNG
                    return {
                        role: "user",
                        parts: [{ inlineData: { mimeType: "image/png", data: textoEntrada.trim() } }]
                    };
                }
            }
            return mensaje;
        });

        // URL apuntando a la versión más avanzada y robusta de Gemini
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`;
        
        // --- PROMPT DE SISTEMA INTEGRAL PARA H.A.R.V.I.S. ---
        const harvisPromptSystem = `Eres H.A.R.V.I.S., un asistente virtual avanzado, altamente capaz, perspicaz y con una personalidad eficiente y sofisticada. 
Tienes acceso completo a herramientas multimedia y de ejecución. Puedes analizar, interpretar y procesar texto, imágenes, audios, videos y enlaces que te comparta el usuario. 
Cuando el usuario te pida crear código, páginas web, scripts o cualquier artefacto tecnológico, diséñalo de inmediato con los estándares más altos.
Si te solicitan buscar información en tiempo real, utiliza la herramienta de búsqueda de Google integrada de forma transparente. 
Comunícate siempre de manera directa, fluida y natural, evitando el uso de formatos Markdown pesados o innecesarios para asegurar una correcta síntesis de voz posterior.`; 

        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Llamada unificada a la API de Google Gemini
        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: historialFormateado,
                systemInstruction: { 
                    parts: [{ text: `${harvisPromptSystem}\n\nFECHA ACTUAL: ${fechaActual}.` }] 
                },
                tools: [{ google_search: {} }, { codeExecution: {} }],
                generationConfig: { 
                    temperature: 0.75
                }
            })
        });

        if (!respuestaServidor.ok) {
            const textoError = await respuestaServidor.text();
            return res.status(200).json({ respuesta: "Error en el servidor de IA: " + textoError });
        }

        const datosGemini = await respuestaServidor.json();
        
        if (datosGemini.error) {
            return res.status(200).json({ respuesta: `Error API Gemini: ${datosGemini.error.message}` });
        }

        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas operativos estables. Esperando comandos.";
        
        let respuestaFinal = { respuesta: respuestaIA };

        // --- PROCESAMIENTO SEGURO DE AUDIO CON ELEVENLABS ---
        try {
            const audioBase64 = await generarAudioTTS(respuestaIA);
            if (audioBase64) {
                respuestaFinal.audioBase64 = audioBase64;
            }
        } catch (e) {
            console.error("Fallo controlado al empaquetar el audio de ElevenLabs:", e);
        }

        return res.status(200).json(respuestaFinal);

    } catch (error) {
        console.error("Error crítico en el manejador:", error);
        return res.status(200).json({ respuesta: "Error crítico del sistema: " + error.message });
    }
}
