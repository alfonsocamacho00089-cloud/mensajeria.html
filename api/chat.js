export default async function handler(req, res) {
    // Configuración de cabeceras CORS originales
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; 

        // 🔍 DIAGNÓSTICO 1: ¿Vercel realmente está leyendo la variable?
        if (!apiKey) {
            return res.status(200).json({ respuesta: "⚠️ ERROR BACKEND: La variable GEMINI_API_KEY está vacía o no existe en este proyecto de Vercel." });
        }

        // 🔍 DIAGNÓSTICO 2: ¿La llave viene mocha, incompleta o rota?
        if (apiKey.length < 10) {
            return res.status(200).json({ respuesta: `⚠️ ERROR BACKEND: La llave leída es demasiado corta (${apiKey.length} caracteres). Revisa cómo se guardó.` });
        }

        // URL original que rescataste
        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, conciso y con un sutil toque de sarcasm. Respuestas cortas.";

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
        
        // 🔍 DIAGNÓSTICO 3: Si Google rechaza la petición, te mandamos el motivo exacto al teléfono
        if (datosGemini.error) {
            return res.status(200).json({ 
                respuesta: `❌ GOOGLE RECHAZÓ LA LLAVE: [Código ${datosGemini.error.code}] - ${datosGemini.error.message}` 
            });
        }

        // Procesamiento normal si todo va bien
        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content?.parts?.[0]?.text) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        } else {
            return res.status(200).json({ respuesta: "⚠️ Google no dio error, pero la estructura de la respuesta vino vacía." });
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(200).json({ respuesta: `💥 Fallo crítico en el Catch del Servidor: ${error.message}` });
    }
}
