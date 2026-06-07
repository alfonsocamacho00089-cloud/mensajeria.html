export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { fileName } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos service_role para saltar RLS en la firma

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Faltan las variables de entorno en Vercel' });
  }

  try {
    const nombreBucket = "lives";
    const rutaArchivo = fileName.trim();

    // 🔑 CORRECCIÓN DE ENDPOINT: La API nativa de Supabase para crear URLs firmadas de subida (Create Signed Upload URL)
    const urlFirmaSupabase = `${supabaseUrl.trim()}/storage/v1/object/upload/sign/${nombreBucket}/${rutaArchivo}`;

    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey.trim()}`,
        'apikey': supabaseKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        expiresIn: 900 // El token dura 15 minutos para subir el video pesado
      })
    });

    const textoRespuesta = await response.text();
    console.log("📢 RESPUESTA CRUDA DE SUPABASE:", textoRespuesta);

    let data;
    try {
      data = JSON.parse(textoRespuesta);
    } catch (e) {
      return res.status(500).json({ error: `Supabase no devolvió JSON: ${textoRespuesta}` });
    }

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.message || data.error || 'Error en Supabase' });
    }

    // Supabase te devolverá una propiedad que contiene la URL pre-firmada exacta o un token de subida
    // Estructura normal de respuesta: { url: '/lives/tu-video.mp4?token=...' } o { signedUrl: '...' }
    const signedUrlRelative = data.signedUrl || data.url;

    if (!signedUrlRelative) {
      return res.status(500).json({ error: 'No se recibió el token de subida desde Supabase' });
    }

    // Unimos para darte la URL completa de subida limpia
    const uploadUrl = signedUrlRelative.startsWith('http') 
      ? signedUrlRelative 
      : `${supabaseUrl.trim()}/storage/v1/object/upload/sign/${nombreBucket}/${rutaArchivo}?token=${data.token || ''}`;

    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
