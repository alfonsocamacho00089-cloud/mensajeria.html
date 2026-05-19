export default async function handler(req, res) {

    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');



    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });



    try {

        // Recibimos el historial completo desde el teléfono

        const { chatHistory } = req.body;

        const apiKey = process.env.GEMINI_API_KEY; 



        if (!apiKey) return res.status(500).json({ error: 'Falta la configuración del servidor.' });



        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const harvisPromptSystem = "Eres H.A.R.V.I.S. 1.0, el asistente virtual e ingenioso creado por Pedro Peres para YouSpace. Sé experto, conciso y con un sutil toque de sarcasmo. Respuestas cortas.";



        const respuestaServidor = await fetch(urlGemini, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                contents: chatHistory, // <-- Aquí le pasamos la conversación completa a Google

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



Y esto en el Json en enviar mensaje esto 

// === CONEXIÓN DIRECTA E INVISIBLE VÍA VERCEL API (CON MEMORIA FLUIDA) ===

        if (targetID === "harvis_user_system") {

            try {

                // 1. Guardamos tu mensaje en la memoria del chat

                historialHarvisVercel.push({ role: "user", parts: [{ text: msg }] });



                // 2. Le pegamos a tu servidor mandándole TODO el historial acumulado

                const respuestaServidor = await fetch('/api/chat', {

                    method: 'POST',

                    headers: { 'Content-Type': 'application/json' },

                    body: JSON.stringify({ chatHistory: historialHarvisVercel }) // <-- Enviamos la memoria

                });



                const datos = await respuestaServidor.json();

                const respuestaIA = datos.respuesta || "Sistemas listos, Pedro.";

                const harvisMsgId = "msg_harvis_" + Date.now();

                

                // 3. Guardamos la respuesta de H.A.R.V.I.S. en la memoria para el próximo mensaje

                historialHarvisVercel.push({ role: "model", parts: [{ text: respuestaIA }] });



                if (typeof hablarHarvis === "function") {

                    hablarHarvis(respuestaIA);

                }



                pintarMensaje(respuestaIA, 'msg-izquierda', null, 'leido', harvisMsgId, 'texto');

                

                await guardarLocal('mensajes', { 

                    id: harvisMsgId, 

                    contactoId: targetID,

                    texto: respuestaIA, 

                    clase: 'msg-izquierda', 

                    status: 'leido',

                    tipo: 'texto',

                    ts: Date.now(),

                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })

                });



            } catch (errorCentral) {

                console.error("❌ Error en el enlace con el servidor de Vercel:", errorCentral);

            }

     }

     

