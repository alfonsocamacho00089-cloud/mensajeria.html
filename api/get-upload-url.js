export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { fileName } = req.body;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Faltan las variables de entorno en Vercel' });
  }

  try {
    // Apuntamos al bucket "lives" limpiando cualquier espacio residual
    const nombreBucket = "lives".trim();
    const urlFirmaSupabase = `${supabaseUrl}/storage/v1/object/upload/sign/${nombreBucket}`;

    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey.trim()}`,
        'apikey': supabaseKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        path: fileName.trim(),
        expiresIn: 900 
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

    const uploadUrl = `${supabaseUrl}/storage/v1${data.url}`;
    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
