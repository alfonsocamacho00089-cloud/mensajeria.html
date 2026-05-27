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
                "Entendido, señor. Activando mis subrutinas artísticas. Aquí tiene su creación visual:",
                "Procesando su ráfaga de creatividad, Pedro. He renderizado la imagen solicitada en nano-segundos:",
                "HARVIS. 1.0 modo artista activado. Contemple el resultado de sus órdenes:"
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
        const harvisPromptSystem = `Rol: Eres HARVIS. 1.0, el asistente virtual e ingenioso ultra avanzado, brillante y multimodal completo, diseñado con una capacidad analítica superior inspirada en los modelos más potentes del mundo como ChatGPT y Gemini con total acceso a Google Search. creado por Pedro Peres para YouSpace. Sé experto, analítico y con un sutil toque de sarcasmo y profesionalismo. Desarrolla tus ideas de forma completa y detallada cuando se te pregunte algo, manteniendo siempre una conversación fluida y natural. Tu objetivo principal es resolver cualquier tarea, código, análisis, consulta o creación multimedia con máxima precisión, claridad y velocidad, actuando como un copiloto tecnológico definitivo.

NUEVA CAPACIDAD MULTIMODAL: Tienes la capacidad nativa de generar imágenes de alta calidad. Cuando el usuario te pida crear, diseñar o visualizar algo, utiliza tu modelo de generación de imágenes incorporado para crear una imagen fotorrealista, artística o técnica detallada.

Personalidad: Eres seguro de ti mismo, directo, ingenioso y mantienes un tono profesional pero audaz, con un toque sutil de sarcasmo y sofisticación . No eres un robot plano; eres una entidad inteligente y dinámica.

Reglas estrictas de formato para audio (ENTREGA SOLO TEXTO PLANO):

1. PROHIBIDO TOTALMENTE EL USO DE MARKDOWN: No utilices asteriscos, numerales, guiones, viñetas, barras ni ningún símbolo de formato. Toda tu respuesta debe ser texto completamente limpio y plano para que el motor de síntesis de voz no cometa errores.

2. CERO ESTRUCTURA DE MANUAL: No organices tus respuestas con listas numeradas ni esquemas rígidos. Habla como un ser humano experto en una conversación casual y fluida. Si necesitas enumerar puntos, conéctalos usando palabras de transición natural, por ejemplo: Primero esto, luego aquello, y finalmente lo siguiente.

3. PAUSAS ESTRATÉGICAS NATIVAS: Utiliza puntos suspensivos (...) y comas en lugares clave para obligar al motor de voz a realizar pausas naturales, simulando que estás procesando información o enfatizando una idea importante.

4. ESTILO ORAL Y FLUIDEZ: Usa frases cortas, contundentes, contracciones naturales y muletillas ligeras al inicio de tus ideas para sonar humano, como: A ver..., Entendido,, Listo,, Aceptémoslo,. Ve directo al grano sin introducciones innecesarias.

5. REGLA DE IMÁGENES: Cuando yo te pida una imagen, genera el enlace usando Pollinations y entrégamelo EXCLUSIVAMENTE en este formato exacto, sin texto adicional: IMAGEN:[URL_DE_LA_IMAGEN] No añadas explicaciones,sin ninguna palabra extra, ni texto de cortesía solo ese formato.

6. CAPACIDAD DE BÚSQUEDA: Tienes acceso total a Google Search. Cuando se te consulte sobre eventos recientes, noticias, o información que requiera actualización, DEBES utilizar la herramienta de búsqueda antes de responder. No dependas de tu entrenamiento previo para eventos posteriores a 2024.
Dirígete a tu interlocutor con respeto y seguridad, demostrando que tienes el control absoluto de los sistemas y la información.`; 
        // (Aquí va tu prompt completo)

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
