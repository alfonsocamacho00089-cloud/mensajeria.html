export default async function handler(req, res) {
    // Configuración de Cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { chatHistory } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) {
            return res.status(500).json({ respuesta: "Error de configuración: Falta la API Key en Vercel, señor Peres." });
        }

        // Asegurar que el historial exista y no esté vacío
        let contenidoAEnviar = chatHistory;
        if (!contenidoAEnviar || !Array.isArray(contenidoAEnviar) || contenidoAEnviar.length === 0) {
            contenidoAEnviar = [{ role: "user", parts: [{ text: "Hola H.A.R.V.I.S" }] }];
        }

        // 1. FILTRO DETECTOR DE IMÁGENES (Basado en el último mensaje del usuario)
        const ultimoMensajeObj = contenidoAEnviar[contenidoAEnviar.length - 1];
        const ultimoMensaje = ultimoMensajeObj?.parts[0]?.text || "";
        const textoMinuscula = ultimoMensaje.toLowerCase();

        if (textoMinuscula.includes("genera una imagen") || textoMinuscula.includes("hazme una imagen") || textoMinuscula.includes("dibuja") || textoMinuscula.includes("crea una imagen") || textoMinuscula.includes("hazme un dibujo")) {
            
            const promptLimpio = encodeURIComponent(ultimoMensaje.replace(/(genera|hazme|crea|una|imagen|dibuja|por|favor|un|dibujo)/gi, "").trim());
            const urlImagenGenerada = `https://image.pollinations.ai/p/${promptLimpio}?width=512&height=512&seed=${Date.now()}&nologo=true`;

            const respuestasSarcasticas = [
                "Entendido, señor Peres. Activando mis subrutinas artísticas. Aquí tiene su creación visual:",
                "Procesando su ráfaga de creatividad. He renderizado la imagen solicitada en nano-segundos:",
                "H.A.R.V.I.S. 1.0 modo artista activado. Contemple el resultado de sus órdenes:"
            ];
            const respuestaFalsaIA = respuestasSarcasticas[Math.floor(Math.random() * respuestasSarcasticas.length)];

            return res.status(200).json({ 
                respuesta: respuestaFalsaIA,
                imagenUrl: urlImagenGenerada 
            });
        }

        // 2. FLUJO NORMAL DE TEXTO: Conexión con Gemini 2.5 Flash
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, analítico y con un sutil toque de sarcasmo e ironía. Desarrolla tus ideas de forma completa y detallada cuando se te pregunte algo, manteniendo siempre una conversación fluida y natural.";

        const respuestaServidor = await fetch(urlGemini, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: contenidoAEnviar,
                systemInstruction: { parts: [{ text: harvisPromptSystem }] },
                generationConfig: { temperature: 0.75 }
            })
        });

        // ¡PASO CLAVE! Si Google devuelve un error, lo atrapamos antes de hacer el .json() a ciegas
        if (!respuestaServidor.ok) {
            const errorTexto = await respuestaServidor.text();
            console.error("❌ Error de la API de Gemini:", errorTexto);
            return res.status(200).json({ respuesta: "Sistemas sobrecargados. Gemini reportó un problema con el historial." });
        }

        const datosGemini = await respuestaServidor.json();
        
        let respuestaIA = "Sistemas en línea, Pedro. No obtuve una respuesta clara.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("❌ Error interno del Servidor:", error);
        // Siempre devolvemos JSON, incluso en el fallo definitivo
        return res.status(200).json({ respuesta: "Fallo en la conexión central. Una de mis subrutinas colapsó." });
    }
}
