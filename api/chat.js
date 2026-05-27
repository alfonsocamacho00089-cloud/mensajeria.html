export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    try {
        const { chatHistory } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; 

        if (!apiKey) return res.status(500).json({ error: 'Falta la configuración del servidor.' });

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

        // 2. FLUJO NORMAL DE TEXTO: Si no pidió imagen, continúa con Gemini regular
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, analítico y con un sutil toque de sarcasmo e ironía. Desarrolla tus ideas de forma completa y detallada cuando se te pregunte algo, manteniendo siempre una conversación fluida y natural.";

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
        
        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(500).json({ error: 'Fallo en la conexión central.' });
    }
}
