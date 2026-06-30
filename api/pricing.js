// /api/pricing — CRUD para los JSON de precios.
//
// GET  /api/pricing?product=bbot         -> { content: {...}, sha }
// PUT  /api/pricing?product=bbot         -> body es el JSON completo; commitea + actualiza audit log
//
// Soft delete: el cliente envía el JSON con _deleted: true en items de
// arrays / maps que quiera "borrar lógicamente". El cotizador frontend
// ya respeta esa marca y los omite del flujo.

import {
  requireAuth, readJsonBody, ghGetFile, ghPutFile,
  isValidProduct, productPath, AUDIT_LOG_PATH, diffJson
} from './_utils.js';

export default async function handler(req, res) {
  try {
    const sess = requireAuth(req, res);
    if (!sess) return;

    const product = req.query?.product || new URL(req.url, 'http://x').searchParams.get('product');
    if (!isValidProduct(product)) {
      return res.status(400).json({ error: `Producto inválido: ${product}` });
    }
    const filepath = productPath(product);

    if (req.method === 'GET') {
      const file = await ghGetFile(filepath);
      if (!file.exists) return res.status(404).json({ error: `${filepath} no existe` });
      let json;
      try { json = JSON.parse(file.content); }
      catch (e) { return res.status(500).json({ error: `JSON corrupto en ${filepath}: ${e.message}` }); }
      return res.status(200).json({ product, content: json, sha: file.sha });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const next = body.content;
      if (!next || typeof next !== 'object') {
        return res.status(400).json({ error: 'Falta `content` con el JSON completo' });
      }

      const existing = await ghGetFile(filepath);
      let prev = null;
      try { prev = existing.exists ? JSON.parse(existing.content) : null; } catch {}

      const changes = prev ? diffJson(prev, next) : [];
      if (changes.length === 0) {
        return res.status(200).json({ ok: true, changes: 0, note: 'Sin cambios' });
      }

      // Construir resumen para el commit message
      const summary = changes.length === 1
        ? changes[0].path
        : `${changes.length} cambios (${changes.slice(0, 3).map(c => c.path).join(', ')}${changes.length > 3 ? '…' : ''})`;
      const message = `admin(${sess.user}): ${product} → ${summary}`;

      // Pretty print 2-space indent para que el diff en git sea legible
      const serialized = JSON.stringify(next, null, 2) + '\n';
      const putResult = await ghPutFile(filepath, serialized, message);

      // Append al audit log
      try {
        const auditFile = await ghGetFile(AUDIT_LOG_PATH);
        let log = { entries: [] };
        if (auditFile.exists) {
          try { log = JSON.parse(auditFile.content); }
          catch { log = { entries: [] }; }
          if (!Array.isArray(log.entries)) log.entries = [];
        }
        const ts = new Date().toISOString();
        for (const c of changes) {
          log.entries.unshift({
            ts,
            user:    sess.user,
            product,
            path:    c.path,
            old:     compactValue(c.old),
            new:     compactValue(c.new),
            commit:  putResult.commit
          });
        }
        // Limitar histórico a 1000 entradas para no inflar
        if (log.entries.length > 1000) log.entries = log.entries.slice(0, 1000);
        await ghPutFile(
          AUDIT_LOG_PATH,
          JSON.stringify(log, null, 2) + '\n',
          `admin(${sess.user}): audit log +${changes.length} (${product})`
        );
      } catch (e) {
        console.error('[pricing] audit log update failed:', e);
        // No bloqueamos el save por una falla en el log
      }

      return res.status(200).json({
        ok: true,
        changes: changes.length,
        commit: putResult.commit,
        message
      });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('[pricing] error:', e);
    return res.status(500).json({ error: e.message || 'Error interno' });
  }
}

// Trunca valores largos para que el log no se infle con objetos grandes
function compactValue(v) {
  if (v === null || v === undefined) return v;
  if (typeof v === 'object') {
    const s = JSON.stringify(v);
    return s.length > 200 ? s.slice(0, 200) + '…' : v;
  }
  return v;
}
