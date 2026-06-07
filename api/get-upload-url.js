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
    // 🔑 ENDPOINT CORRECTO: Se le pega al bucket general "lives"
    const urlFirmaSupabase = `${supabaseUrl}/storage/v1/object/upload/sign/lives`;

    const response = await fetch(urlFirmaSupabase, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      // 🔑 AQUÍ VA EL NOMBRE DEL ARCHIVO: Supabase lo exige dentro del JSON
      body: JSON.stringify({ 
        path: fileName,
        expiresIn: 900 // 15 minutos de validez
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(500).json({ error: data.error || 'Supabase rechazó la firma' });
    }

    // Supabase nos devuelve la ruta firmada relativa en 'data.url'.
    // Armamos la URL completa para que tu teléfono haga el PUT directo.
    const uploadUrl = `${supabaseUrl}/storage/v1${data.url}`;

    return res.status(200).json({ uploadUrl: uploadUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
