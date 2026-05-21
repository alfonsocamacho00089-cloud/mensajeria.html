export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory } = req.body;

        // 1. Lee la variable directamente del entorno seguro de Vite
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

// 2. La URL se mantiene exactamente igual, usando la constante de arriba
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
                respuesta: `❌ GOOGLE DIJO DESDE EL CÓDIGO: [Código ${datosGemini.error.code}] - ${datosGemini.error.message}` 
            });
        }

        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content?.parts?.[0]?.text) {
            respuestaIA = datosGemini.candidates[0].content.parts[0].text;
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        return res.status(200).json({ respuesta: `💥 Fallo crítico: ${error.message}` });
    }
}
