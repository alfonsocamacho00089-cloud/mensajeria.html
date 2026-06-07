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
    // 🔑 CORRECCIÓN DE RUTA: Supabase exige la estructura /object/upload/sign/bucket/archivo
    const urlFirmaSupabase = `${supabaseUrl}/storage/v1/object/upload/sign/lives/${fileName}`;

    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expiresIn: 900 // El pase dura 15 minutos para subir el video pesado
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error || 'Supabase rechazó la creación del pase' });
    }

    // Supabase nos devuelve una parte del enlace en data.url. 
    // Construimos la URL de subida definitiva metiéndole la firma autorizada
    const uploadUrl = `${supabaseUrl}/storage/v1${data.url}`;

    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
