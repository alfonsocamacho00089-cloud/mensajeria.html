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
    // URL REST limpia para solicitar la subida firmada
    // Cambia "lives" por el nombre exacto de tu bucket en Supabase
const urlFirmaSupabase = `${supabaseUrl}/storage/v1/object/upload/sign/lives`;
    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey.trim()}`, // Limpiamos espacios invisibles
        'apikey': supabaseKey.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        path: fileName,
        expiresIn: 900 
      })
    });

    // Capturamos el texto crudo de la respuesta para saber qué dice Supabase
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
