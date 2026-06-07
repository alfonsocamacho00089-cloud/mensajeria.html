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
    // Petición nativa a la API de Supabase para crear la URL pre-firmada (Válida por 15 minutos)
    const response = await fetch(`${supabaseUrl}/storage/v1/object/upload/sign/lives`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        path: fileName,
        expiresIn: 900 // 15 minutos
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error || 'Error al generar la firma' });
    }

    // Supabase devuelve el PATH de subida. Construimos la URL firmada completa.
    // OJO: La URL de subida pre-firmada usa el endpoint /object/upload/sign/
    const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/lives/${data.url || data.path || fileName}`;

    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
