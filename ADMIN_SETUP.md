# Setup de la consola Admin

La consola admin (`/admin`) requiere **5 variables de entorno** en Vercel para funcionar. Sin ellas, los endpoints devuelven 500.

## 1. Generar un GitHub Personal Access Token

Necesitas un token con permisos para escribir en el repo (los cambios de precios se persisten como commits).

1. Ve a https://github.com/settings/tokens?type=beta (Fine-grained PAT)
2. **Repository access** → Only select repositories → `jpoumian-cyber/cotizador-av`
3. **Repository permissions**:
   - `Contents` → **Read and write**
   - `Metadata` → Read (auto)
4. Genera el token (empieza con `github_pat_…`). Cópialo — solo se muestra una vez.

## 2. Generar un secret para firmar sesiones

Un string aleatorio largo. Cualquier opción sirve:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Guarda el output.

## 3. Configurar las variables en Vercel

Ve a https://vercel.com/dashboard → tu proyecto `cotizador-av` → **Settings → Environment Variables**, y agrega estas 5 (todas para Production, Preview y Development):

| Nombre | Valor | Notas |
|---|---|---|
| `ADMIN_USER` | `jpoumian` | el username con el que entras |
| `ADMIN_PASS` | `<contraseña en texto plano>` | usa una contraseña fuerte |
| `JWT_SECRET` | `<output del paso 2>` | firma las cookies de sesión |
| `GITHUB_TOKEN` | `<PAT del paso 1>` | empieza con `github_pat_…` |
| `GITHUB_REPO` | `jpoumian-cyber/cotizador-av` | owner/repo |

Opcionalmente:

| Nombre | Default | Notas |
|---|---|---|
| `GITHUB_BRANCH` | `main` | si commitas a otro branch |

## 4. Redeploy

Las env vars se aplican solo a nuevos deploys. Tras agregarlas:

- O bien hacés un push (cualquier commit dispara redeploy)
- O en el dashboard de Vercel: **Deployments → … → Redeploy**

## 5. Usar la consola

Abre `https://cotizador-av.vercel.app/admin`. Login con `ADMIN_USER` / `ADMIN_PASS`.

### Funcionalidades

- **Editor**: cambia precios y estructura comercial por producto (BBot/VendIA/OMIA) y canal (Averix Directo / Telcel Reseller).
- **Borrado lógico**: en items dentro de arrays/maps (planes, plazos, add-ons, tiers de soporte), botón **🗑 Borrar** marca el item con `_deleted: true`. El cotizador lo ignora automáticamente. Botón **↺ Restaurar** lo reactiva.
- **Guardar Cambios**: dispara un PUT a `/api/pricing/<product>` que:
  1. Verifica auth (cookie firmada)
  2. Hace diff contra la versión actual
  3. Commit del JSON actualizado al repo vía GitHub Contents API
  4. Append al `pricing/_audit_log.json` (otro commit) con el detalle (path, valor antes/después, usuario, timestamp, SHA del commit)
  5. Vercel auto-despliega (~30s) — los cambios se reflejan en el cotizador
- **Auditoría**: lee `pricing/_audit_log.json`. Filtros por producto y por cantidad. Cada entrada incluye el SHA del commit (puedes ir a GitHub y ver el diff exacto).

## Endpoints

| Endpoint | Método | Auth | Función |
|---|---|---|---|
| `/api/auth` | GET | — | Devuelve sesión actual o 401 |
| `/api/auth` | POST `{action:"login", username, password}` | — | Login (set cookie) |
| `/api/auth` | POST `{action:"logout"}` | — | Logout (clear cookie) |
| `/api/pricing?product=bbot` | GET | sí | Devuelve el JSON completo del producto |
| `/api/pricing?product=bbot` | PUT `{content: {...}}` | sí | Persiste cambios + log |
| `/api/audit-log?product=bbot&limit=50` | GET | sí | Lee el log de auditoría |

## Seguridad

- **Cookie de sesión**: HTTP-only, `Secure`, `SameSite=Strict`, expira en 8 horas. Firmada con HMAC-SHA256 (no JWT estándar pero equivalente).
- **Sin npm deps**: solo `crypto` y `fetch` built-in de Node 20.
- **Rate limiting**: básico (retardo de 400ms en login fallido). Para producción seria, agregar IP-based throttling vía middleware Vercel.
- **Trazabilidad**: cada cambio genera 2 commits firmados con el usuario admin en el mensaje (`admin(jpoumian): bbot → averix_directo.set_up.alta_whatsapp`). Más el append al audit log.

## Cómo cambiar tu contraseña

Edita `ADMIN_PASS` en Vercel y redeploya. La sesión actual seguirá viva hasta que expire (8h), las nuevas usarán la contraseña nueva.

## Cómo agregar un segundo admin

El MVP soporta **1 usuario**. Para agregar más, hay que modificar `api/auth.js` para leer una lista (env var `ADMIN_USERS=alice:passA,bob:passB`) o migrar a base de datos.
