export default async function handler(req, res) {
    // Configurar cabeceras para evitar bloqueos de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        // Recibimos el historial completo que envía tu Frontend en SpaceChat
        const { chatHistory } = req.body;

        // ⚠️ REEMPLAZA ESTA URL POR EL ENDPOINT DE TU APP REAL EN STREAMLIT
        const urlStreamlit = "https://tu-app-de-streamlit.streamlit.app/api/harvis";

        // Vercel actúa como pasarela invisible y le pasa el paquete de datos a Streamlit
        const respuestaServidor = await fetch(urlStreamlit, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatHistory: chatHistory })
        });

        const datosStreamlit = await respuestaServidor.json();
        
        // Extraemos la respuesta que generó Streamlit usando su API Key interna
        let respuestaIA = "Sistemas listos, Pedro.";
        if (datosStreamlit && datosStreamlit.respuesta) {
            respuestaIA = datosStreamlit.respuesta;
        }

        return res.status(200).json({ respuesta: respuestaIA });

    } catch (error) {
        console.error("❌ Fallo en el puente central hacia Streamlit:", error);
        return res.status(500).json({ respuesta: "Sistemas en mantenimiento central, Pedro." });
    }
}
