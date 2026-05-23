export default async function handler(req, res) {
    // ... (tus cabeceras CORS)

    try {
        const { chatHistory, userKey } = req.body;
        const apiKey = userKey;

        // Memoria volátil para gestionar el borrado de archivos en esta sesión
        const archivosEnUso = [];

        const historialFormateado = await Promise.all(chatHistory.map(async (mensaje) => {
            
            // 1. Si es mensaje de IA o texto simple (sin Base64), pasar
            if (mensaje.role !== "user" || !mensaje.parts[0]?.text || 
                (!mensaje.parts[0].text.includes("base64,") && !mensaje.parts[0].text.startsWith("GkXf"))) {
                return mensaje;
            }

            // 2. Si ya tiene fileData, lo consideramos procesado
            if (mensaje.parts[0].fileData) {
                if (archivosEnUso.length < 4) archivosEnUso.push(mensaje.parts[0].fileData.fileUri);
                return mensaje;
            }

            // 3. Procesar archivo NUEVO
            const subida = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: { mimeType: 'audio/webm', displayName: 'audio_sesion' } })
            });
            
            const datosSubida = await subida.json();

            // Lógica de borrado automático (Si llega a 4, borra el más viejo)
            if (archivosEnUso.length >= 4) {
                const uriABorrar = archivosEnUso.shift();
                const fileId = uriABorrar.split('/').pop();
                await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileId}?key=${apiKey}`, {
                    method: 'DELETE'
                });
            }

            archivosEnUso.push(datosSubida.file.uri);

            // 4. RETORNO CON TEXTO PRESERVADO (Para que tu App pinte el mensaje)
            return {
                role: "user",
                parts: [
                    { text: "Audio procesado" }, 
                    { fileData: { mimeType: "audio/webm", fileUri: datosSubida.file.uri } }
                ]
            };
        }));

        // ... (Tu llamada a Gemini con 'historialFormateado') ...
        // (El resto de tu lógica de respuesta permanece igual)

    } catch (error) {
        return res.status(200).json({ respuesta: "💥 Error: " + error.message });
    }
}
