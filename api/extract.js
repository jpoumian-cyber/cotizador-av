const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { clientType, files } = req.body;
    if (!files || !files.length) return res.status(400).json({ error: 'No se recibieron archivos' });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const promptPF = `Eres un asistente especializado en extracción de datos de documentos legales mexicanos.
Analiza cuidadosamente TODOS los documentos adjuntos (pueden ser Constancia de Situación Fiscal, INE, comprobante de domicilio, etc.) y extrae la información para llenar un contrato de Persona Física.

Devuelve ÚNICAMENTE un objeto JSON válido con exactamente estos campos:
{
  "nombre": "nombre completo de la persona física tal como aparece en los documentos",
  "rfc": "RFC con homoclave, ej: GAMA800101XYZ",
  "curp": "CURP completo de 18 caracteres",
  "cic": "número CIC de la credencial para votar (10 dígitos)",
  "email": "correo electrónico si aparece en algún documento",
  "domicilio": "domicilio completo: calle, número exterior, número interior si aplica, colonia, municipio o delegación, estado y código postal"
}
Instrucciones:
- Busca el RFC en la Constancia de Situación Fiscal del SAT
- El CURP puede estar en la Constancia SAT o en el INE
- El CIC aparece al reverso del INE/IFE, es un número de 10 dígitos
- El domicilio puede venir del comprobante de domicilio o de la Constancia SAT
- Si un campo no está disponible en ningún documento, usa string vacío ""
- No incluyas explicaciones, solo el JSON`;

    const promptPM = `Eres un asistente especializado en extracción de datos de documentos legales mexicanos.
Analiza cuidadosamente TODOS los documentos adjuntos (Constancia de Situación Fiscal, Acta Constitutiva, Poder Notarial, identificación del representante, comprobante de domicilio) y extrae la información para llenar un contrato de Persona Moral (empresa).

Devuelve ÚNICAMENTE un objeto JSON válido con exactamente estos campos:
{
  "razon_social": "razón social de la empresa SIN incluir S.A. DE C.V. al final",
  "rfc": "RFC de la empresa con homoclave",
  "email": "correo electrónico de la empresa si aparece",
  "domicilio": "domicilio fiscal completo: calle, número, colonia, municipio, estado, CP",
  "num_escritura": "número de escritura pública del acta constitutiva, ej: 20,648",
  "fecha_escritura": "fecha del acta constitutiva escrita así: 15 de enero del 2020",
  "notario": "nombre completo del Licenciado o Notario que otorgó el acta constitutiva",
  "num_notario": "número de la notaría o correduría del acta constitutiva",
  "ciudad_notario": "ciudad donde se ubica la notaría del acta constitutiva",
  "ciudad_rpc": "ciudad donde quedó inscrita en el Registro Público de Comercio",
  "folio_mercantil": "número de folio mercantil electrónico, ej: N-2022064331",
  "representante_legal": "nombre completo del representante legal o administrador único",
  "num_poder": "número de escritura pública del poder notarial del representante legal",
  "notario_poder": "nombre del notario que otorgó el poder notarial (puede ser el mismo del acta)",
  "num_notario_poder": "número de notaría del poder notarial",
  "ciudad_poder": "ciudad de la notaría del poder notarial"
}
Instrucciones:
- La razón social y RFC están en la Constancia de Situación Fiscal del SAT
- Los datos del Acta Constitutiva (escritura, notario, folio) están en el Acta Constitutiva
- Los datos del representante legal y poder notarial están en el Poder Notarial
- El domicilio puede venir del comprobante de domicilio o de la Constancia SAT
- Si un campo no está disponible, usa string vacío ""
- No incluyas explicaciones, solo el JSON`;

    const content = [{ type: 'text', text: clientType === 'pf' ? promptPF : promptPM }];

    for (const file of files) {
      if (!file || !file.data) continue;
      const mediaType = file.type === 'application/pdf' ? 'application/pdf'
        : file.type === 'image/png' ? 'image/png'
        : file.type === 'image/webp' ? 'image/webp'
        : 'image/jpeg';

      if (file.type === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: file.data }
        });
      } else {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: file.data }
        });
      }
    }

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content }],
      betas: ['pdfs-2024-09-25']
    });

    const text = msg.content[0].text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(200).json({ success: false, error: 'No se pudo parsear la respuesta', raw: text });

    const data = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ success: true, data });

  } catch (err) {
    console.error('Extract error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '25mb' } }
};
