# Paso 02 — Cotizador VendIA integrado al Cotizador Averix

**Fecha:** 2026-05-06  
**Producto:** VendIA — Comercio Conversacional en WhatsApp  
**Estado:** nota histórica. El modelo de precios de esta página fue reemplazado.

> Validado contra el código el 2026-11-01. VendIA sigue en el cotizador (color `#15803d`, pestaña propia, propuesta imprimible), pero **no** usa ON DEMAND por hora ni los planes Starter / Business / Enterprise de las tablas de abajo. El esquema vigente está en `pricing/vendia.json`.

## Esquema vigente (no el de las tablas siguientes)

Canal **Averix Directo**

| Concepto | Valor |
|---|---|
| Set up (pago único) | $12,000 |
| Fee 12 meses | $6,000/mes |
| Fee 24 meses | $5,400/mes (10%) |
| Fee 36 meses | $4,800/mes (20%) |
| Plantillas Meta | marketing $0.70, utilidad $0.25, OTP $0.25, servicio $0.20 |

Canal **Telcel Reseller:** set up $5,000; fees $9,747 / $8,772 / $7,798; plantillas marketing $1.13, utilidad $0.71, OTP $0.64, servicio $0.39.

Además, el formulario actual incluye:

- Add-on “Plataforma de Atención a Cliente (BC Bot)”, que toma planes y set up de `pricing/bbot.json` del mismo canal.
- Costos de referencia (no se suman a la inversión): delivery Uber Direct y comisión Stripe (3.6% + $3 MXN, +0.5% internacional, +2% conversión).
- Plan Anual Preferente: otro 10% sobre el set up y sobre el fee del plazo, hardcodeado (`* 0.9`). No lee `_meta.descuento_anual_pct`.
- OMIA es un tercer producto (plazos 12/24/36, set up $5,000, fee Averix $8,998 / $8,098 / $7,198). No está en esta nota.
- La versión visible en el header es **v3.0**. El `<title>` sigue diciendo “Broadcaster Bot & VendIA”.
- Árbol de archivos actual: `cotizador.html`, `admin.html`, `contratos.html`, `api/`, `pricing/`, `logos/`, `vercel.json`, `package.json`, `ADMIN_SETUP.md` y estas dos notas.

---

## Objetivo

Agregar el producto **VendIA** como una segunda sección al cotizador existente de Broadcaster Bot, generando una propuesta comercial profesional con su propia identidad visual (verde #15803d) y estructura de precios propia.

---

## Activos utilizados desde Google Drive

| Archivo | Drive ID | Uso |
|---|---|---|
| VENDIA TELCEL EMPRESAS v3.pptx.pdf | `11BptyFE6aNQBqhWlWS9QYDF8NMnaPEb1` | Descripción del producto, flujo, módulos y beneficios |
| Cotizador esquema Precios 2024_Bot.xlsx | `1sf5E2TztI5xIloSTC7FcolsgVS9Jyj_-` | Referencia de estructura de precios y tarifas |
| vendia.png (Logos_Assets) | `1DFuIUMKQ27H-61nhu3RLGc3kJL51BzZF` | Logo VendIA (ya existía en logos/) |
| averix.png (Logos_Assets) | `1bL7EUg2U57Zv89Ofy9bnvN8Vdr-VPm7k` | Logo Averix (ya existía en logos/) |

---

## Cambios realizados en `cotizador.html`

### Estructura general

- **Título actualizado:** "Cotizador Averix — Broadcaster Bot & VendIA" (v2.0)
- **Selector de producto** (tabs) agregado debajo del header:
  - 🤖 Broadcaster Bot (azul marino #1a2d6e)
  - 🛒 VendIA (verde #15803d)
- La sección de información del cliente es **compartida** entre ambos productos
- Cada producto tiene su propia sección de formulario y propuesta imprimible

### Identidad visual VendIA

- **Color primario:** `#15803d` (verde bosque)
- **Fondo card:** `#f0fdf4`
- **Tabla inversión:** encabezado verde, totales verdes
- **Portada:** fondo verde sólido con logos en blanco

---

## Estructura de Precios VendIA

### ON DEMAND — Setup (Pago Único)

| Concepto | Precio Unit. |
|---|---|
| Alta y configuración inicial (fijo) | $2,999 |
| Config. Flujo de Venta (por hora) | $999/hr |
| Config. Catálogo & Productos (por hora) | $999/hr |
| Config. Sucursales (por hora) | $1,200/hr |
| Integración Pasarela de Pagos (por hora) | $1,200/hr |
| Integración Delivery / Entrega (por hora) | $1,200/hr |
| Desarrollo a la medida (por hora) | $2,200/hr |
| Soporte (por hora) | $900/hr |

### ON DEMAND — Suscripción Mensual

| Concepto | Precio |
|---|---|
| Plataforma VendIA (base): flujo guiado, catálogo 50 prod, 1 sucursal, gestión de pedidos | $2,999/mes |
| Módulo de Lealtad / Fidelización | $999/mes |
| Multi-Sucursal (pack adicional) | $999/mes |
| Pasarela de Pagos integrada | $1,999/mes |
| IA Personalización — Pymes (<5K) | $2,999/mes |
| IA Personalización — Medianas (5K–50K) | $5,999/mes |
| IA Personalización — Grandes (50K+) | $9,999/mes |

### POR PLAN

| Plan | Precio/mes | Incluye |
|---|---|---|
| **Starter** | $3,999 | 1 catálogo, 50 productos, 1 sucursal, flujo básico, gestión de pedidos |
| **Business** | $7,999 | 3 catálogos, 200 productos, 3 sucursales, lealtad básica, 1 pasarela de pagos |
| **Enterprise** | $14,999 | Ilimitados catálogos/productos/sucursales, lealtad avanzada, multi-pasarela, delivery, IA |

**Setup (todos los planes):** $2,999 pago único  
**Plan Anual Preferente:** 10% descuento en setup + suscripción mensual

---

## Flujo de Compra VendIA (propuesta imprimible)

```
[1. Inicio] → [2. Selección] → [3. Pago] → [4. Entrega]
El cliente     Explora catálogo  Pago en línea   Pedido procesado
inicia en WA   y elige productos  o contra entrega  automáticamente
```

---

## Módulos descritos en la propuesta

**Core:**
- Catálogo de Productos
- Flujo de Compra Guiado
- Gestión de Pedidos

**Adicionales:**
- Sucursales
- Lealtad / Fidelización
- Pasarela de Pagos
- Integración Delivery
- IA Personalización

---

## Páginas de la propuesta imprimible VendIA

1. **Portada** — Logo Averix + Logo VendIA, nombre del cliente, fecha
2. **Descripción + Flujo + Módulos** — qué es VendIA, flujo de 4 pasos, módulos core y adicionales
3. **Alcance específico + Tabla de Inversión** — tabla dinámica con setup y suscripción
4. **Consideraciones Comerciales + Aceptación** — términos, condiciones, firma

---

## Archivos del proyecto

```
~/cotizador-av/
├── cotizador.html           ← App principal (v2.0 con BBot + VendIA)
├── logos/
│   ├── averix.png
│   ├── vendia.png           ← Logo VendIA
│   ├── broadcasterbot.png
│   └── omia.png
├── paso-01-analisis-activos.md
└── paso-02-vendia.md        ← Este archivo
```
