export default async function handler(req, res) {
  // 1. Asegurar método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { fileName } = req.body;
  
  // 2. Limpiar variables de entorno evitando espacios invisibles
  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, ""); 
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Faltan las variables de entorno en Vercel' });
  }

  if (!fileName) {
    return res.status(400).json({ error: 'Falta el nombre del archivo (fileName)' });
  }

  try {
    const nombreBucket = "lives";
    
    // ⚠️ LA RUTA EXACTA: /storage/v1/object/upload/sign/lives
    const urlFirmaSupabase = `${supabaseUrl}/storage/v1/object/upload/sign/${nombreBucket}`;

    console.log("🚀 Intentando firmar en:", urlFirmaSupabase);

    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      // Pasamos la ruta interna donde se guardará el archivo dentro del bucket
      body: JSON.stringify({ 
        path: fileName.trim(),
        expiresIn: 900 // URL válida por 15 minutos
      })
    });

    const textoRespuesta = await response.text();
    console.log("📢 RESPUESTA CRUDA DE SUPABASE:", textoRespuesta);

    let data;
    try {
      data = JSON.parse(textoRespuesta);
    } catch (e) {
      return res.status(500).json({ error: `Supabase no devolvió un JSON válido: ${textoRespuesta}` });
    }

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.message || data.error || 'Error devuelto por Supabase' });
    }

    // Supabase devuelve un objeto con { url: "/lives/nombre-archivo.mp4?token=..." }
    // Construimos la URL completa para que el frontend suba el archivo binario directamente
    const uploadUrl = `${supabaseUrl}/storage/v1${data.url}`;
    
    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    console.error("❌ Error en Catch:", error);
    return res.status(500).json({ error: error.message });
  }
}
