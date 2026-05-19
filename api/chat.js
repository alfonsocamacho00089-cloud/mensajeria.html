export default async function handler(req, res) {
    // 1. Asegurar cabeceras CORS para que tu teléfono no sea bloqueado
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { chatHistory } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return res.status(200).json({ respuesta: "Falta la API Key en las variables de entorno de Vercel, señor Peres." });
        }

        // 2. Formatear y limpiar estrictamente el historial para la API de Google
        // La API espera un array con objetos que tengan 'role' y 'parts'
        let contentsClean = [];
        
        if (chatHistory && Array.isArray(chatHistory)) {
            contentsClean = chatHistory.map(msg => {
                // Forzar que el rol sea 'user' o 'model' (Gemini no acepta 'assistant' en REST nativo)
                let apiRole = msg.role === 'assistant' ? 'model' : msg.role;
                return {
                    role: apiRole,
                    parts: [{ text: msg.parts?.[0]?.text || msg.texto || "" }]
                };
            }).filter(msg => msg.parts[0].text.trim() !== ""); // Eliminar mensajes vacíos
        }

        // Si el historial filtrado quedó vacío, inicializamos uno por defecto
        if (contentsClean.length === 0) {
            contentsClean.push({ role: "user", parts: [{ text: "Hola H.A.R.V.I.S" }] });
        }

        // 3. Evaluar si el último mensaje pide una imagen (Filtro Pollinations)
        const ultimoTexto = contentsClean[contentsClean.length - 1]?.parts[0]?.text.toLowerCase() || "";
        if (ultimoTexto.includes("genera una imagen") || ultimoTexto.includes("hazme una imagen") || ultimoTexto.includes("dibuja") || ultimoTexto.includes("crea una imagen")) {
            const promptLimpio = encodeURIComponent(ultimoTexto.replace(/(genera|hazme|crea|una|imagen|dibuja|por|favor)/gi, "").trim());
            const urlImagenGenerada = `https://image.pollinations.ai/p/${promptLimpio}?width=512&height=512&seed=${Date.now()}&nologo=true`;
            
            return res.status(200).json({ 
                respuesta: "Activando subrutinas artísticas, Pedro. Aquí tiene su diseño:",
                imagenUrl: urlImagenGenerada 
            });
        }

        // 4. Conexión segura con Gemini 2.5 Flash
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, conciso y con un sutil toque de sarcasmo. Respuestas cortas.";

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contentsClean,
                systemInstruction: { parts: [{ text: harvisPromptSystem }] },
                generationConfig: { temperature: 0.75 }
            })
        });

        // Si Google responde con error, atrapamos el texto para no romper el .json()
        if (!respuestaServidor.ok) {
            const errorRaw = await respuestaServidor.text();
            console.error("❌ Error crudo de la API de Gemini:", errorRaw);
            return res.status(200).json({ respuesta: "Gemini rechazó los parámetros del historial actual, Pedro." });
        }

        const datosGemini = await respuestaServidor.json();
        
        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content?.parts?.[0]?.text) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        // Retornamos un JSON garantizado
        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("❌ Fallo crítico en el Catch de la API:", error);
        // Retorno de emergencia para que el frontend NUNCA reciba una respuesta vacía
        return res.status(200).json({ respuesta: "H.A.R.V.I.S. en modo de emergencia. Hubo un fallo en el procesamiento de Node." });
    }
}
