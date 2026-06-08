export default async function handler(req, res) {
  // 1. Forzar que sea POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { tipoEvento, contenido, metadata } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos la master key para escritura directa

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Faltan variables de entorno en Vercel' });
  }

  if (!tipoEvento || !contenido) {
    return res.status(400).json({ error: 'Faltan parámetros: tipoEvento o contenido' });
  }

  try {
    const urlLimpia = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
    
    // El ID fijo y sagrado de SpaxioFlow que descubrimos hoy
    const chatTargetID = "26fmetp4Q4WJ"; 

    // 🧠 Formateo Estructurado del Evento administrado por la lógica de tu ecosistema
    const nuevoEvento = {
      chat_id: chatTargetID,
      // 🔥 AHORA ES DINÁMICO: Si le pasas un remitente en el body lo usa, si no, usa H.A.R.V.I.S. por defecto
      sender_name: req.body.remitente || "H.A.R.V.I.S.", 
      tipo: tipoEvento,         // 'texto', 'imagen', 'video'
      content: contenido,       // Mensaje de texto o la URL directa de Supabase Storage
      meta_info: metadata || {}, 
      created_at: new Date().toISOString()
    };
    // 📡 Inserción directa en la REST API de Supabase sin librerías pesadas
    const urlSupabaseRest = `${urlLimpia}/rest/v1/spaxioflow_feed`;

    const response = await fetch(urlSupabaseRest, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey.trim()}`,
        'apikey': supabaseKey.trim(),
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Le pide a Supabase que devuelva la fila creada
      },
      body: JSON.stringify(nuevoEvento)
    });

    const textoRespuesta = await response.text();
    console.log("🤖 H.A.R.V.I.S. Registro en Supabase:", textoRespuesta);

    if (!response.ok) {
      return res.status(500).json({ error: `Supabase rechazó el guardado: ${textoRespuesta}` });
    }

    // Retornamos éxito al frontend del teléfono
    return res.status(200).json({ 
      success: true, 
      msg: "Evento registrado en el flujo global por H.A.R.V.I.S.",
      data: JSON.parse(textoRespuesta)
    });

  } catch (error) {
    console.error("❌ Error en endpoint SpaxioFlow:", error);
    return res.status(500).json({ error: error.message });
  }
}
