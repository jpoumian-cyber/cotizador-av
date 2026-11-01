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
- **Borrado lógico**: el botón **🗑 Borrar** aparece en objetos con `price`, `label` o `fee`, y en cada ítem de un array. Marca `_deleted: true` y agrega `_deleted_at` / `_deleted_by`. **↺ Restaurar** quita esas tres claves. El cotizador deja fuera los planes, los tiers de soporte, las opciones de IA y las filas de delivery marcadas. Un add-on marcado queda en precio 0 (el checkbox sigue visible). Un plazo marcado no se quita de la tarjeta 12/24/36: elegirla rompe el cálculo porque el código asume que el plazo existe. Los tramos de agentes y de templates sí tienen botón de borrar, pero el calculador no lee `_deleted`. `plantillas_meta` y la pasarela Stripe no tienen botón: no traen `price`, `label` ni `fee`.
- **Guardar Cambios**: dispara un `PUT /api/pricing?product=<bbot|vendia|omia>` con cuerpo `{content: {...}}` que:
  1. Verifica auth (cookie firmada)
  2. Hace diff contra el archivo en GitHub
  3. Si no hay diferencias, responde `{ok: true, changes: 0}` y no crea commits
  4. Si las hay, hace commit del JSON vía GitHub Contents API. El mensaje es `admin(<usuario>): <producto> → <path o resumen>`
  5. Intenta un segundo commit que antepone las entradas a `pricing/_audit_log.json` (path, valor antes/después, usuario, timestamp, SHA del commit de precios). Si ese commit falla, el precio **igual queda guardado**; el error solo va al log de la función. El archivo se recorta a 1,000 entradas. Objetos de más de 200 caracteres se guardan truncados.
  6. Vercel auto-despliega (~30s) cuando entra un commit — el cotizador lee los JSON estáticos, no la API
- **Auditoría**: `GET /api/audit-log` lee `pricing/_audit_log.json` (lista vacía si el archivo aún no existe). Filtros `product` y `limit` (la UI ofrece 50, 100, 200 y 1,000). La tabla muestra los primeros 7 caracteres del SHA, sin enlace. El SHA completo está en el JSON.

## Endpoints

| Endpoint | Método | Auth | Función |
|---|---|---|---|
| `/api/auth` | GET | — | `{ user, exp }` o 401. Igual exige las 5 env vars: si falta alguna responde 500 |
| `/api/auth` | POST `{action:"login", username, password}` | — | Login (set cookie `cotz_sess`) |
| `/api/auth` | POST `{action:"logout"}` | — | Logout (clear cookie) |
| `/api/pricing?product=bbot` | GET | sí | `{ product, content, sha }` del JSON en GitHub |
| `/api/pricing?product=bbot` | PUT `{content: {...}}` | sí | Persiste cambios y, si puede, el log |
| `/api/audit-log?product=bbot&limit=50` | GET | sí | `{ entries }` más recientes primero |

Productos válidos: `bbot`, `vendia`, `omia`. Otro valor responde 400.

`/api/extract` no es de esta consola. Lo usa `/contratos` y requiere `ANTHROPIC_API_KEY` (dependencia `@anthropic-ai/sdk`). Sin esa variable el admin sigue funcionando.

## Seguridad

- **Cookie de sesión**: nombre `cotz_sess`. HTTP-only, `Secure`, `SameSite=Strict`, `Path=/`, expira en 8 horas. El valor es `base64url(JSON {u, exp}).HMAC-SHA256` (no es un JWT con header).
- **API admin sin npm**: `api/auth.js`, `api/pricing.js`, `api/audit-log.js` y `api/_utils.js` usan solo `crypto` y `fetch` de Node. El único dependency del repo es `@anthropic-ai/sdk`, y solo lo importa `api/extract.js`.
- **Rate limiting**: básico (retardo de 400ms en login fallido). Para producción seria, agregar IP-based throttling vía middleware Vercel.
- **Trazabilidad**: un cambio con diff crea el commit de precios (`admin(jpoumian): bbot → averix_directo.set_up.alta_whatsapp`) y, en el caso feliz, un segundo commit de audit log. No son atómicos.
- **Campo que el editor muestra y el cotizador ignora**: `_meta.descuento_anual_pct`. El 10% anual está fijo en `cotizador.html`. Cambiar ese número en el admin no cambia las propuestas. `canal_activo` sí define el canal con el que abre el cotizador (lee el de `bbot.json`).

## Cómo cambiar tu contraseña

Edita `ADMIN_PASS` en Vercel y redeploya. La sesión actual seguirá viva hasta que expire (8h), las nuevas usarán la contraseña nueva.

## Cómo agregar un segundo admin

El MVP soporta **1 usuario**. Para agregar más, hay que modificar `api/auth.js` para leer una lista (env var `ADMIN_USERS=alice:passA,bob:passB`) o migrar a base de datos.
