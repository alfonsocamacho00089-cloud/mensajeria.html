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

                        inlineData: {

                            mimeType: "audio/webm",

                            data: base64Puro.trim()

                        }

                    }]

                };

            }

            return mensaje;

        });



        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userKey}`;

        

        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S.... (tu prompt completo aquí)`; 

        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });



        
// ... (dentro de tu handler)

// --- TU CÓDIGO ACTUAL (FUNCIONANDO) ---
const respuestaServidor = await fetch(urlGemini, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: historialFormateado,
        systemInstruction: { 
            parts: [{ text: `${harvisPromptSystem}\n\nFECHA ACTUAL: ${fechaActual}.` }] 
        },
        tools: [{ google_search: {} }, { codeExecution: {} }],
        generationConfig: { temperature: 0.75 }
    })
});

if (!respuestaServidor.ok) {
    const textoError = await respuestaServidor.text();
    return res.status(200).json({ respuesta: "Error en el servidor: " + textoError });
}

// 1. Recibes el JSON del servidor
const data = await respuestaServidor.json();

// 2. Primero: Mostrar el texto (Esto lo haces siempre)
mostrarEnChat(data.respuesta);

// 3. PRIORIDAD 1: Voz Nativa (Lo que ya tienes funcionando)
// Se dispara instantáneamente para que el usuario no espere
hablarConVozNativa(data.respuesta); 

// 4. PRIORIDAD 2: El "regalo" (La nota de voz)
// Si el servidor logró generar el audio, lo guardamos o mostramos el botón
if (data.audioBase64) {
    console.log("Nota de voz generada con éxito, disponible para el usuario.");
    
    // Aquí puedes hacer que aparezca un botón de "Reproducir Nota de Voz"
    // o un icono de audio junto a la burbuja del chat
    prepararBotonDeAudio(data.audioBase64);
} else {
    console.log("No se pudo generar nota de voz, solo texto disponible.");
}
