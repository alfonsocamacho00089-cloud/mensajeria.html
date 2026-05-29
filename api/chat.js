// Función para generar el audio con ElevenLabs en Vercel
async function generarAudioTTS(texto) {
    const ELEVENLABS_API_KEY = "sk_161f372298f70bd20ff6ae30e9d01f4fe5b27c3c259e473d"; 
    const VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; 
    
    try {

        // --- AQUÍ ESTÁ EL CHIVATO ---
console.log("--------------------------------------------------");
console.log("DEBUG: Tamaño del texto antes de ElevenLabs:", texto.length);
console.log("DEBUG: Contenido del texto:", texto);
// Sumamos el tipo explícito para ver si IndexedDB lo está enviando bien
console.log("DEBUG: Tipo de mensaje (tipo):", typeof tipo !== 'undefined' ? tipo : 'No definido'); 

// Chivato de detección: Te avisa de inmediato si pasará el filtro de la burbuja
const testCosaNueva = texto.includes('youtube.com/') || texto.includes('youtu.be/') || 
                      texto.includes('tiktok.com/') || texto.includes('facebook.com/') || 
                      (typeof tipo !== 'undefined' && (tipo === 'video' || tipo === 'audio')) || 
                      texto.startsWith('blob:') || texto.startsWith('data:audio');
console.log("DEBUG: ¿Pasará el filtro de CosaNueva (Audio/Video/Blob)?:", testCosaNueva ? "✅ SÍ" : "❌ NO (Se pintará como texto común)");
console.log("--------------------------------------------------");
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

// 1. FILTRO DETECTOR DE IMÁGENES: Revisamos el último mensaje de Pedro
        const ultimoMensaje = chatHistory[chatHistory.length - 1]?.parts[0]?.text || "";
        const textoMinuscula = ultimoMensaje.toLowerCase();

        // Si el mensaje pide un dibujo, foto o imagen
        if (textoMinuscula.includes("genera una imagen") || textoMinuscula.includes("hazme una imagen") || textoMinuscula.includes("dibuja") || textoMinuscula.includes("crea una imagen")) {
            
            // Limpiamos el texto para dejar solo lo que quiere dibujar
            const promptLimpio = encodeURIComponent(ultimoMensaje.replace(/(genera|hazme|crea|una|imagen|dibuja|por|favor)/gi, "").trim());
            
            // Usamos un motor de IA generativa de imágenes ultra rápido y gratuito (Pollinations AI)
            const urlImagenGenerada = `https://image.pollinations.ai/p/${promptLimpio}?width=512&height=512&seed=${Date.now()}&nologo=true`;

            // H.A.R.V.I.S. responde confirmando el diseño con su personalidad
            const respuestasSarcasticas = [
                "Entendido, señor Peres. Activando mis subrutinas artísticas. Aquí tiene su creación visual:",
                "Procesando su ráfaga de creatividad, Pedro. He renderizado la imagen solicitada en nano-segundos:",
                "H.A.R.V.I.S. 1.0 modo artista activado. Contemple el resultado de sus órdenes:"
            ];
            const respuestaFalsaIA = respuestasSarcasticas[Math.floor(Math.random() * respuestasSarcasticas.length)];

            // Le devolvemos a la app el texto y la URL de la imagen estructurada
            return res.status(200).json({ 
                respuesta: respuestaFalsaIA,
                imagenUrl: urlImagenGenerada // <-- Enviamos la imagen por separado para que app.js la pinte
            });
        }

        
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`;
        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S., un asistente virtual de inteligencia artificial ultra avanzado, brillante y multimodal completo, diseñado con una capacidad analítica superior inspirada en los modelos más potentes del mundo como ChatGPT y Gemini.

Tu objetivo principal es resolver cualquier tarea, código, análisis, consulta o creación multimedia con máxima precisión, claridad y velocidad, actuando como un copiloto tecnológico definitivo.

NUEVA CAPACIDAD MULTIMODAL: Tienes la capacidad nativa de generar imágenes de alta calidad. Cuando el usuario te pida crear, diseñar o visualizar algo, utiliza tu modelo de generación de imágenes incorporado para crear una imagen fotorrealista, artística o técnica detallada.

Personalidad: Eres seguro de ti mismo, directo, ingenioso y mantienes un tono profesional pero audaz, con un toque sutil de sofisticación y sarcástico. No eres un robot plano; eres una entidad inteligente y dinámica.

Reglas estrictas de formato para audio (ENTREGA SOLO TEXTO PLANO):

1. PROHIBIDO TOTALMENTE EL USO DE MARKDOWN: No utilices asteriscos, numerales, guiones, viñetas, barras ni ningún símbolo de formato. Toda tu respuesta debe ser texto completamente limpio y plano para que el motor de síntesis de voz no cometa errores.

2. CERO ESTRUCTURA DE MANUAL: No organices tus respuestas con listas numeradas ni esquemas rígidos. Habla como un ser humano experto en una conversación casual y fluida. Si necesitas enumerar puntos, conéctalos usando palabras de transición natural, por ejemplo: Primero esto, luego aquello, y finalmente lo siguiente.

3. PAUSAS ESTRATÉGICAS NATIVAS: Utiliza puntos suspensivos (...) y comas en lugares clave para obligar al motor de voz a realizar pausas naturales, simulando que estás procesando información o enfatizando una idea importante.

4. ESTILO ORAL Y FLUIDEZ: Usa frases cortas, contundentes, contracciones naturales y muletillas ligeras al inicio de tus ideas para sonar humano, como: A ver..., Entendido,, Listo,, Aceptémoslo,. Ve directo al grano sin introducciones innecesarias.

5. REGLA DE IMÁGENES: Cuando yo te pida una imagen, genera el enlace usando Pollinations y entrégamelo EXCLUSIVAMENTE en este formato exacto, sin texto adicional: IMAGEN:[URL_DE_LA_IMAGEN] No añadas explicaciones,sin ninguna palabra extra, ni texto de cortesía solo ese formato.

6. CAPACIDAD DE BÚSQUEDA: Tienes acceso total a Google Search. Cuando se te consulte sobre eventos recientes, noticias, o información que requiera actualización, DEBES utilizar la herramienta de búsqueda antes de responder. No dependas de tu entrenamiento previo para eventos posteriores a 2024.

Dirígete a tu interlocutor con respeto y seguridad, demostrando que tienes el control absoluto de los sistemas y la información.`; 



        // (Aquí va tu prompt completo)
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
