// /api/auth — handles login, logout, and "me" (current session info).
// POST { action: "login", username, password } -> sets session cookie
// POST { action: "logout" } -> clears cookie
// GET                       -> returns { user } if authenticated, else 401

import {
  env, createToken, setSessionCookie, clearSessionCookie,
  getSession, readJsonBody
} from './_utils.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const sess = getSession(req);
      if (!sess) return res.status(401).json({ error: 'No autenticado' });
      return res.status(200).json({ user: sess.user, exp: sess.exp });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Método no permitido' });
    }

    const body = await readJsonBody(req);
    const action = body.action || 'login';

    if (action === 'logout') {
      clearSessionCookie(res);
      return res.status(200).json({ ok: true });
    }

    if (action === 'login') {
      const { user: adminUser, pass: adminPass } = env();
      const u = String(body.username || '').trim();
      const p = String(body.password || '');
      if (u !== adminUser || p !== adminPass) {
        // Pequeño retraso para mitigar fuerza bruta básica
        await new Promise(r => setTimeout(r, 400));
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = createToken(adminUser);
      setSessionCookie(res, token);
      return res.status(200).json({ ok: true, user: adminUser });
    }

    return res.status(400).json({ error: 'Acción desconocida' });
  } catch (e) {
    console.error('[auth] error:', e);
    return res.status(500).json({ error: e.message || 'Error interno' });
  }
}
