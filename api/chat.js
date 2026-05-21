export default async function handler(req, res) {
    // Configuración de Cabeceras CORS de forma segura
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        // Recibimos de forma dinámica el historial y la llave enviada desde tu móvil
        const { chatHistory, userKey } = req.body;
        const apiKey = userKey; 

        if (!apiKey || apiKey.trim() === "") {
            return res.status(200).json({ respuesta: "🔑 H.A.R.V.I.S.: No detecto ninguna clave local en su dispositivo. Por favor, regístrela en la consola." });
        }

        // =================================================================
        // FILTRO DETECTOR DE IMÁGENES (Bifurcación Inteligente)
        // =================================================================
        const ultimoMensaje = chatHistory[chatHistory.length - 1]?.parts[0]?.text || "";
        const textoMinuscula = ultimoMensaje.toLowerCase();
        const esPeticionImagen = textoMinuscula.includes("genera una imagen") || 
                                 textoMinuscula.includes("hazme una imagen") || 
                                 textoMinuscula.includes("dibuja") || 
                                 textoMinuscula.includes("crea una imagen") ||
                                 textoMinuscula.includes("hazme un dibujo");

        if (esPeticionImagen) {
            // Limpiamos el texto para dejar solo la descripción pura del arte que quieres crear
            const promptLimpio = encodeURIComponent(ultimoMensaje.replace(/(genera|hazme|crea|una|imagen|dibuja|un|dibujo|por|favor)/gi, "").trim());
            
            // Renderizador libre de Pollinations AI acoplado a YouSpace
            const urlImagenGenerada = `https://image.pollinations.ai/p/${promptLimpio}?width=512&height=512&seed=${Date.now()}&nologo=true`;

            // Diálogos de H.A.R.V.I.S. con su toque irónico característico
            const respuestasSarcasticas = [
                "Entendido, señor Peres. Activando mis subrutinas artísticas y consumiendo ciclos de procesamiento en su creación visual:",
                "Procesando su ráfaga de creatividad, Pedro. He renderizado la imagen solicitada en nano-segundos. Contemple el resultado:",
                "H.A.R.V.I.S. 1.0 modo artista activado. Aquí tiene el resultado gráfico de sus órdenes, señor:"
            ];
            const respuestaFalsaIA = respuestasSarcasticas[Math.floor(Math.random() * respuestasSarcasticas.length)];

            // Retornamos la respuesta combinada (Texto irónico + URL de la imagen)
            return res.status(200).json({ 
                respuesta: respuestaFalsaIA,
                imagenUrl: urlImagenGenerada 
            });
        }

        // =================================================================
        // FLUJO NORMAL DE TEXTO CON GEMINI 2.5 FLASH
        // =================================================================
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, analítico y con un sutil toque de sarcasmo e ironía. Desarrolla tus ideas de forma completa, explicando en detalle cuando sea necesario, pero manteniendo la fluidez natural de una conversación.";

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: chatHistory,
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

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(200).json({ respuesta: `💥 Fallo crítico en el servidor central: ${error.message}` });
    }
}
