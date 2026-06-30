// /api/audit-log — lee el log de auditoría.
// GET /api/audit-log              -> { entries: [...] }
// GET /api/audit-log?limit=50     -> primeras N entradas (más recientes)
// GET /api/audit-log?product=bbot -> filtra por producto

import { requireAuth, ghGetFile, AUDIT_LOG_PATH } from './_utils.js';

export default async function handler(req, res) {
  try {
    const sess = requireAuth(req, res);
    if (!sess) return;

    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const file = await ghGetFile(AUDIT_LOG_PATH);
    if (!file.exists) return res.status(200).json({ entries: [] });

    let log;
    try { log = JSON.parse(file.content); }
    catch { return res.status(200).json({ entries: [] }); }
    let entries = Array.isArray(log.entries) ? log.entries : [];

    const q = req.query || {};
    if (q.product) entries = entries.filter(e => e.product === q.product);

    const limit = parseInt(q.limit, 10);
    if (Number.isFinite(limit) && limit > 0) entries = entries.slice(0, limit);

    return res.status(200).json({ entries });
  } catch (e) {
    console.error('[audit-log] error:', e);
    return res.status(500).json({ error: e.message || 'Error interno' });
  }
}
