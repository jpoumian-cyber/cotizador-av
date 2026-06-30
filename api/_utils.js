// Shared utilities for admin API.
// No npm dependencies — uses Node's built-in `crypto` and global `fetch`.

import crypto from 'node:crypto';

const COOKIE_NAME = 'cotz_sess';
const TOKEN_TTL_SEC = 60 * 60 * 8; // 8 hours

function need(name) {
  const v = process.env[name];
  if (!v) {
    // Diagnóstico: lista nombres (no valores) de env vars relevantes que SÍ están seteadas
    const relevant = Object.keys(process.env)
      .filter(k => /^(ADMIN|JWT|GITHUB|VERCEL)/i.test(k))
      .sort();
    throw new Error(`Missing env var: ${name}. Detectadas: [${relevant.join(', ') || '(ninguna)'}]`);
  }
  return v;
}

export function env() {
  return {
    user:    need('ADMIN_USER'),
    pass:    need('ADMIN_PASS'),
    secret:  need('JWT_SECRET'),
    ghToken: need('GITHUB_TOKEN'),
    ghRepo:  need('GITHUB_REPO'),                 // e.g. "jpoumian-cyber/cotizador-av"
    ghBranch: process.env.GITHUB_BRANCH || 'main'
  };
}

// ----- Session token (HMAC signed, stateless) -----

export function createToken(user) {
  const { secret } = env();
  const payload = JSON.stringify({ u: user, exp: Date.now() + TOKEN_TTL_SEC * 1000 });
  const data = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const dot = token.indexOf('.');
  if (dot < 0) return null;
  const data = token.slice(0, dot);
  const sig  = token.slice(dot + 1);
  const { secret } = env();
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(data, 'base64url').toString()); }
  catch { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return { user: payload.u, exp: payload.exp };
}

// ----- Cookie parsing / setting -----

export function parseCookies(req) {
  const out = {};
  const raw = req.headers?.cookie;
  if (!raw) return out;
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k) out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

export function setSessionCookie(res, token, maxAgeSec = TOKEN_TTL_SEC) {
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${maxAgeSec}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Secure'
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict; Secure`);
}

export function getSession(req) {
  const tok = parseCookies(req)[COOKIE_NAME];
  return verifyToken(tok);
}

export function requireAuth(req, res) {
  const sess = getSession(req);
  if (!sess) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  return sess;
}

// ----- GitHub Contents API helpers -----

const GH_API = 'https://api.github.com';

async function ghFetch(path, init = {}) {
  const { ghToken } = env();
  const resp = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${ghToken}`,
      'Accept':        'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent':    'cotizador-av-admin',
      ...(init.headers || {})
    }
  });
  return resp;
}

export async function ghGetFile(filepath) {
  const { ghRepo, ghBranch } = env();
  const resp = await ghFetch(`/repos/${ghRepo}/contents/${encodeURIComponent(filepath)}?ref=${ghBranch}`);
  if (resp.status === 404) return { exists: false, sha: null, content: null };
  if (!resp.ok) throw new Error(`GitHub GET ${filepath}: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  const buf = Buffer.from(data.content, data.encoding || 'base64');
  return { exists: true, sha: data.sha, content: buf.toString('utf8') };
}

export async function ghPutFile(filepath, content, message) {
  const { ghRepo, ghBranch } = env();
  const existing = await ghGetFile(filepath);
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch:  ghBranch,
    ...(existing.exists ? { sha: existing.sha } : {})
  };
  const resp = await ghFetch(`/repos/${ghRepo}/contents/${encodeURIComponent(filepath)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`GitHub PUT ${filepath}: ${resp.status} ${errText}`);
  }
  const data = await resp.json();
  return { sha: data.content?.sha, commit: data.commit?.sha };
}

// ----- Body parsing -----

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;  // Vercel often parses for us
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { throw new Error('Invalid JSON body'); }
}

// ----- Pricing helpers -----

export const PRODUCTS = ['bbot', 'vendia', 'omia'];

export function isValidProduct(p) {
  return PRODUCTS.includes(p);
}

export function productPath(product) {
  return `pricing/${product}.json`;
}

export const AUDIT_LOG_PATH = 'pricing/_audit_log.json';

// ----- Object diff for audit log -----

export function diffJson(prev, next, basePath = '') {
  const changes = [];
  function walk(a, b, path) {
    const ta = typeof a, tb = typeof b;
    if (ta !== tb || (ta !== 'object') || a === null || b === null) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changes.push({ path, old: a, new: b });
      }
      return;
    }
    const aIsArr = Array.isArray(a), bIsArr = Array.isArray(b);
    if (aIsArr !== bIsArr) {
      changes.push({ path, old: a, new: b });
      return;
    }
    if (aIsArr) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        changes.push({ path, old: a, new: b });
      }
      return;
    }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      walk(a[k], b[k], path ? `${path}.${k}` : k);
    }
  }
  walk(prev, next, basePath);
  return changes;
}
