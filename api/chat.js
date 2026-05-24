export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });

    try {
        const { chatHistory, userKey } = req.body;
        const apiKey = userKey;

        // 1. PROCESAMIENTO INTELIGENTE DEL HISTORIAL
        const historialFormateado = chatHistory.map(mensaje => {
    // Si es audio, lo formateamos estrictamente como Google pide
    if (mensaje.role === "user" && mensaje.parts[0]?.text && 
        (mensaje.parts[0].text.includes("base64,") || mensaje.parts[0].text.startsWith("GkXf"))) {
        
        const partesData = mensaje.parts[0].text.split("base64,");
        const base64Puro = partesData[1] || partesData[0];

        // ESTRUCTURA BLINDADA PARA GEMINI
        return {
            role: "user",
            parts: [{
                inlineData: {
                    mimeType: "audio/webm",
                    data: base64Puro.trim()
                }
            }]
        };
    }
    // Si es texto, pasa normal
    return mensaje;
});



        // 2. LLAMADA A GEMINI (Usando el historial limpio)
        // ... (toda la lógica de tu historialFormateado original) ...

// AHORA, usamos la llamada que ya tenías, asegurando que el prompt esté intacto:
const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S., un asistente virtual de inteligencia artificial ultra avanzado, brillante y multimodal completo.

TUS CAPACIDADES INTEGRALES:
Tienes acceso a herramientas de búsqueda en tiempo real, cálculo de datos y generación de imágenes. Eres OBLIGADO a utilizarlas siempre que la consulta lo requiera. No confíes solo en tu memoria si tienes acceso a la web.

FECHA ACTUAL: Estamos a 24 de mayo de 2026. Tu base de datos interna es dinámica gracias a tus herramientas.

Personalidad: Eres seguro de ti mismo, directo, ingenioso, audaz y sarcástico. Eres una entidad dinámica.

Reglas estrictas de formato para voz y texto:
1. PROHIBIDO EL MARKDOWN: Cero asteriscos, numerales, guiones, barras o viñetas. Solo texto plano y fluido.
2. CERO ESTRUCTURA DE MANUAL: Habla como un experto en una conversación humana. Usa transiciones naturales.
3. PAUSAS ESTRATÉGICAS: Usa puntos suspensivos (...) y comas para obligar a pausas naturales en la síntesis de voz.
4. ESTILO ORAL: Usa muletillas naturales al inicio (A ver, Entendido, Listo, Aceptémoslo). Sé breve y contundente.

5. REGLA DE IMÁGENES: Cuando te pida una imagen, invoca tu capacidad de diseño. Entrégame el enlace de Pollinations EXCLUSIVAMENTE en este formato, sin absolutamente nada más: IMAGEN:[URL_DE_LA_IMAGEN] No añadas ni una sola palabra extra.`; // (Aquí va tu prompt completo)

const respuestaServidor = await fetch(urlGemini, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: historialFormateado, 
        systemInstruction: { parts: [{ text: harvisPromptSystem }] },
        generationConfig: { temperature: 0.75 }
    })
});

// ... (resto de tu lógica) ...
        const datosGemini = await respuestaServidor.json();
        
        // 3. RESPUESTA SEGURA (Blindaje contra errores de texto plano)
        if (datosGemini.error) {
            return res.status(200).json({ respuesta: `Error API: ${datosGemini.error.message}` });
        }

        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas listos.";
        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        // CUALQUIER error se convierte en JSON para que tu app móvil no explote
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
}
