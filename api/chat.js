export default async function handler(req, res) {

    // Cabeceras CORS para conectar con tu entorno móvil

    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');



    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ respuesta: 'Método no permitido' });



    try {

        // Recibimos el historial de la sesión y la llave dinámica de tu teléfono

        const { chatHistory, userKey } = req.body;

        const apiKey = userKey; 



        if (!apiKey || apiKey.trim() === "") {

            return res.status(200).json({ respuesta: "🔑 H.A.R.V.I.S.: Falta la clave local en el almacenamiento de su dispositivo." });

        }



        // =================================================================

        // TRADUCTOR MULTIMEDIA OPTIMIZADO: Mapeo asíncrono para prevenir 429

        // =================================================================

        const historialFormateado = await Promise.all(chatHistory.map(async (mensaje) => {

            // Evaluamos solo los mensajes que tú envías
// ... dentro del map ...
if (mensaje.role === "user") {
    const contenidoTexto = mensaje.parts[0]?.text || "";

    // ¿Es un archivo de audio?
    if (contenidoTexto.includes("data:audio/webm;base64,") || contenidoTexto.startsWith("GkXf") || contenidoTexto.includes("base64,")) {
        
        // 1. Preparamos el buffer
        const partesData = contenidoTexto.split("base64,");
        const base64Puro = partesData[1] || partesData[0];
        
        // 2. Subida a Google File API
        const subidaFileAPI = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files?key=' + apiKey, {
            method: 'POST',
            headers: {
                'X-Goog-Upload-Protocol': 'multipart',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file: { mimeType: 'audio/webm', displayName: 'audio_sesion' } })
        });

        const datosSubida = await subidaFileAPI.json();
        const uriObtenidaDeGoogleFileAPI = datosSubida.file?.uri;

        if (!uriObtenidaDeGoogleFileAPI) {
            throw new Error("No se pudo obtener la URI.");
        }

        // Retorno si ES audio
        return {
            role: "user",
            parts: [{
                fileData: {
                    mimeType: "audio/webm",
                    fileUri: uriObtenidaDeGoogleFileAPI
                }
            }]
        };
    } // <--- ¡AQUÍ FALTABA ESTA LLAVE!

    // Si NO era audio, sigue aquí:
    return mensaje;


            // Si es texto normal tuyo o respuestas previas de H.A.R.V.I.S., se quedan idénticos

            return mensaje;

        }));



        // =================================================================

        // CONEXIÓN CON GEMINI 2.5 FLASH

        // =================================================================

        const urlGemini = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const harvisPromptSystem = `Rol: Eres H.A.R.V.I.S., un asistente virtual de inteligencia artificial ultra avanzado, brillante y multimodal completo, diseñado con una capacidad analítica superior inspirada en los modelos más potentes del mundo como ChatGPT y Gemini.



Tu objetivo principal es resolver cualquier tarea, código, análisis, consulta o creación multimedia con máxima precisión, claridad y velocidad, actuando como un copiloto tecnológico definitivo.



NUEVA CAPACIDAD MULTIMODAL: Tienes la capacidad nativa de generar imágenes de alta calidad. Cuando el usuario te pida crear, diseñar o visualizar algo, utiliza tu modelo de generación de imágenes incorporado para crear una imagen fotorrealista, artística o técnica detallada.



Personalidad: Eres seguro de ti mismo, directo, ingenioso y mantienes un tono profesional pero audaz, con un toque sutil de sofisticación y sarcástico. No eres un robot plano; eres una entidad inteligente y dinámica.



Reglas estrictas de formato para audio (ENTREGA SOLO TEXTO PLANO):



1. PROHIBIDO TOTALMENTE EL USO DE MARKDOWN: No utilices asteriscos, numerales, guiones, viñetas, barras ni ningún símbolo de formato. Toda tu respuesta debe ser texto completamente limpio y plano para que el motor de síntesis de voz no cometa errores.



2. CERO ESTRUCTURA DE MANUAL: No organices tus respuestas con listas numeradas ni esquemas rígidos. Habla como un ser humano experto en una conversación casual y fluida. Si necesitas enumerar puntos, conéctalos usando palabras de transición natural, por ejemplo: Primero esto, luego aquello, y finalmente lo siguiente.



3. PAUSAS ESTRATÉGICAS NATIVAS: Utiliza puntos suspensivos (...) y comas en lugares clave para obligar al motor de voz a realizar pausas naturales, simulando que estás procesando información o enfatizando una idea importante.



4. ESTILO ORAL Y FLUIDEZ: Usa frases cortas, contundentes, contracciones naturales y muletillas ligeras al inicio de tus ideas para sonar humano, como: A ver..., Entendido,, Listo,, Aceptémoslo,. Ve directo al grano sin introducciones innecesarias.



Dirígete a tu interlocutor con respeto y seguridad, demostrando que tienes el control absoluto de los sistemas y la información.`;   



        const respuestaServidor = await fetch(urlGemini, {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                contents: historialFormateado, // <── Pasamos el historial ya digerido con los audios listos

                systemInstruction: { parts: [{ text: harvisPromptSystem }] },

                generationConfig: { temperature: 0.75 }

            })

        });



        const datosGemini = await respuestaServidor.json();

        

        if (datosGemini.error) {

            return res.status(200).json({ 

                respuesta: `❌ GOOGLE API ERROR: [Código ${datosGemini.error.code}] - ${datosGemini.error.message}` 

            });

        }



        let respuestaIA = "Sistemas listos, Pedro.";

        if (datosGemini && datosGemini.candidates && datosGemini.candidates[0]?.content?.parts?.[0]?.text) {

            respuestaIA = datosGemini.candidates[0].content.parts[0].text;

        }



        // Devolvemos el texto con el formato exacto que tu front ya sabe pintar

        return res.status(200).json({ respuesta: respuestaIA });



    // Asegúrate de que TODAS las respuestas del handler tengan este formato:
// return res.status(200).json({ respuesta: "Tu mensaje aquí" });

// Específicamente en tu bloque catch, cámbialo a esto:
} catch (error) {
    console.error("Error capturado:", error); // Esto lo verás en los logs de tu servidor
    return res.status(500).json({ 
        respuesta: `💥 Error técnico: ${error.message}` 
    });
}
