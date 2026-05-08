const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'ANTHROPIC_API_KEY no configurada en Vercel' });
  }

  try {
    const { clientType, files } = req.body;
    if (!files || !files.length) {
      return res.status(400).json({ success: false, error: 'No se recibieron archivos' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const promptPF = `Eres un experto en documentos legales mexicanos. Analiza el contenido de los documentos y extrae la información para un contrato de Persona Física.
Responde SOLO con un JSON válido, sin texto adicional:
{
  "nombre": "nombre completo de la persona",
  "rfc": "RFC con homoclave (ej: GAMA800101XYZ)",
  "curp": "CURP de 18 caracteres",
  "cic": "número CIC de la credencial para votar (10 dígitos)",
  "email": "correo electrónico si aparece, si no cadena vacía",
  "domicilio": "domicilio completo: calle, número, colonia, municipio, estado, CP"
}
Si un campo no está disponible usa "".`;

    const promptPM = `Eres un experto en documentos legales mexicanos. Analiza el contenido de los documentos y extrae la información para un contrato de Persona Moral.
Responde SOLO con un JSON válido, sin texto adicional:
{
  "razon_social": "razón social SIN S.A. DE C.V.",
  "rfc": "RFC de la empresa con homoclave",
  "email": "correo electrónico si aparece, si no cadena vacía",
  "domicilio": "domicilio fiscal completo: calle, número, colonia, municipio, estado, CP",
  "num_escritura": "número de escritura pública del acta constitutiva",
  "fecha_escritura": "fecha del acta: 15 de enero del 2020",
  "notario": "nombre completo del Licenciado o Notario del acta constitutiva",
  "num_notario": "número de la notaría del acta constitutiva",
  "ciudad_notario": "ciudad de la notaría del acta constitutiva",
  "ciudad_rpc": "ciudad del Registro Público de Comercio donde está inscrita",
  "folio_mercantil": "folio mercantil electrónico",
  "representante_legal": "nombre completo del representante legal",
  "num_poder": "número de escritura del poder notarial",
  "notario_poder": "nombre del notario del poder notarial",
  "num_notario_poder": "número de notaría del poder notarial",
  "ciudad_poder": "ciudad de la notaría del poder notarial"
}
Si un campo no está disponible usa "".`;

    // Construir content para Claude mezclando texto e imágenes
    const content = [{ type: 'text', text: clientType === 'pf' ? promptPF : promptPM }];

    for (const file of files) {
      if (!file) continue;
      if (file.type === 'text') {
        // Texto extraído de PDF nativo
        content.push({ type: 'text', text: `\n--- Documento: ${file.name} ---\n${file.content}\n---` });
      } else if (file.type === 'image' && file.data) {
        // Imagen comprimida
        const mtype = ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mediaType)
          ? file.mediaType : 'image/jpeg';
        content.push({ type: 'image', source: { type: 'base64', media_type: mtype, data: file.data } });
      }
    }

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content }]
    });

    const text = msg.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({ success: false, error: 'No se pudo parsear respuesta', raw: text.substring(0,300) });
    }

    return res.status(200).json({ success: true, data: JSON.parse(jsonMatch[0]) });

  } catch (err) {
    console.error('Extract error:', err.message);
    return res.status(500).json({ success: false, error: err.message || 'Error interno' });
  }
}

module.exports = handler;
module.exports.config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};
