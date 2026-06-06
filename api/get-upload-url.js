import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { fileName } = req.body;

  // Inicializamos Supabase con las llaves seguras del servidor
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Solicitamos una URL pre-firmada válida por 15 minutos para subir el archivo
  const { data, error } = await supabase.storage
    .from('lives')
    .createSignedUploadUrl(fileName);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Devolvemos la URL segura al teléfono
  return res.status(200).json({ uploadUrl: data.signedUrl });
}
