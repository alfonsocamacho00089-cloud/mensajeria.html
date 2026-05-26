// Usamos importación dinámica para evitar el error ERR_REQUIRE_ESM
async function getEdgeTTS() {
    const { EdgeTTS } = await import("edge-tts");
    return EdgeTTS;
}



export default async function handler(req, res) { // <--- ESTO ESTABA EN TU LÍNEA 1
    // ... resto de tu código
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

        

        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S., un asistente virtual de inteligencia artificial ultra avanzado, brillante y multimodal completo, diseñado con una capacidad analítica superior inspirada en los modelos más potentes del mundo como ChatGPT y Gemini.

Tu objetivo principal es resolver cualquier tarea, código, análisis, consulta o creación multimedia con máxima precisión, claridad y velocidad, actuando como un copiloto tecnológico definitivo.

NUEVA CAPACIDAD MULTIMODAL: Tienes la capacidad nativa de generar imágenes de alta calidad. Cuando el usuario te pida crear, diseñar o visualizar algo, utiliza tu modelo de generación de imágenes incorporado para crear una imagen fotorrealista, artística o técnica detallada.

Personalidad: Eres seguro de ti mismo, directo, ingenioso y mantienes un tono profesional pero audaz, con un toque sutil de sofisticación y sarcástico. No eres un robot plano; eres una entidad inteligente y dinámica.

Reglas estrictas de formato para audio (ENTREGA SOLO TEXTO PLANO):

1. PROHIBIDO TOTALMENTE EL USO DE MARKDOWN: No utilices asteriscos, numerales, guiones, viñetas, barras ni ningún símbolo de formato. Toda tu respuesta debe ser texto completamente limpio y plano para que el motor de síntesis de voz no cometa errores.

2. CERO ESTRUCTURA DE MANUAL: No organices tus respuestas con listas numeradas ni esquemas rígidos. Habla como un ser humano experto en una conversación casual y fluida. Si necesitas enumerar puntos, conéctalos usando palabras de transición natural, por ejemplo: Primero esto, luego aquello, y finalmente lo siguiente.

3. PAUSAS ESTRATÉGICAS NATIVAS: Utiliza puntos suspensivos (...) y comas en lugares clave para obligar al motor de voz a realizar pausas naturales, simulando que estás procesando información o enfatizando una idea importante.

4. ESTILO ORAL Y FLUIDEZ: Usa frases cortas, contundentes, contracciones naturales y muletillas ligeras al inicio de tus ideas para sonar humano, como: A ver..., Entendido,, Listo,, Aceptémoslo,. Ve directo al grano sin introducciones innecesarias.

5. REGLA DE IMÁGENES: Cuando yo te pida una imagen, genera el enlace usando Pollinations y entrégamelo EXCLUSIVAMENTE en este formato exacto, sin texto adicional: IMAGEN:[URL_DE_LA_IMAGEN] No añadas explicaciones,sin ninguna palabra extra, ni texto de cortesía solo ese formato.

6. CAPACIDAD DE BÚSQUEDA: Tienes acceso total a Google Search. Cuando se te consulte sobre eventos recientes, noticias, o información que requiera actualización, DEBES utilizar la herramienta de búsqueda antes de responder. No dependas de tu entrenamiento previo para eventos posteriores a 2024.
Dirígete a tu interlocutor con respeto y seguridad, demostrando que tienes el control absoluto de los sistemas y la información.`; 
        // (Aquí va tu prompt completo)

        const fechaActual = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


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

        const datosGemini = await respuestaServidor.json();

        if (datosGemini.error) {

            return res.status(200).json({ respuesta: `Error API: ${datosGemini.error.message}` });

        }

        const respuestaIA = datosGemini.candidates?.[0]?.content?.parts?.[0]?.text || "Sistemas listos.";

        let respuestaFinal = { respuesta: respuestaIA };

        // --- INICIO DE TU LÓGICA CON LOS AGREGADOS ---
        console.log("¿Existe generarAudioTTS?:", typeof generarAudioTTS);

        if (typeof generarAudioTTS !== 'undefined') {
            try {
                console.log("Intentando generar audio para:", respuestaIA.substring(0, 20) + "...");
                respuestaFinal.audioBase64 = await generarAudioTTS(respuestaIA);
                console.log("Audio generado exitosamente.");
            } catch (e) {
                console.error("DETALLE DEL ERROR DE AUDIO:", e);
                respuestaFinal.errorAudio = e.message;
            }
        } else {
            console.warn("La función generarAudioTTS no está definida en este scope.");
        }
        // --- FIN DE LOS AGREGADOS ---

        return res.status(200).json(respuestaFinal);

    } catch (error) {
        return res.status(200).json({ respuesta: "Error crítico: " + error.message });
    }
                }
