# Paso 01 — Análisis y Mapeo de Activos en Google Drive

**Fecha:** 2026-05-05  
**Carpeta raíz Drive:** Cotizador AV (`1O7QpLb0pIdRSWe4f1A8ywuF43yVbUFbW`)

---

## Estructura de carpetas encontrada

```
Cotizador AV/
├── Logos_Assets/          (1atnoTwerpHGlEPzFLY6wzPzP72Je-Txj)
│   ├── averix.png
│   ├── broadcasterbot.png
│   ├── vendia.png
│   └── omia 1.png
├── Pricing/               (1agRB40-oiDtYx_euiVoext-W7X4Ln897)
│   └── Cotizador esquema Precios 2024_Bot.xlsx
└── Templates Cotizacion/  (1Q7PEYJGtK0vDSz3CSuGG8v4Nv3_1-Ybz)
    └── MACHOTE PROPUESTA COMERCIAL_BBOT CON DESARROLLO.docx
```

---

## Activos descargados localmente

| Archivo | Origen Drive | Uso |
|---------|-------------|-----|
| `logos/averix.png` | Logos_Assets/averix.png | Header cotizador, propuesta |
| `logos/broadcasterbot.png` | Logos_Assets/broadcasterbot.png | Header cotizador, propuesta |
| `logos/vendia.png` | Logos_Assets/vendia.png | Referencia de marca |
| `logos/omia.png` | Logos_Assets/omia 1.png | Referencia de marca |

---

## Estructura de precios extraída del Excel

### Pestaña: Cotizador (ON DEMAND)

#### Precios base (Pago Único — ONBOARDING)

| Concepto | Precio Unitario |
|----------|----------------|
| Alta de cuenta WhatsApp (fijo) | $1,999.00 MXN |
| Configuración de Bot — Informativo (x hora) | $999.00 MXN |
| Configuración de Bot — Integraciones (x hora) | $1,200.00 MXN |
| Desarrollo (x hora) | $2,200.00 MXN |
| Soporte (x hora) | $900.00 MXN |

#### Plan base mensual (PAGO MENSUAL)

| Concepto | Precio |
|----------|--------|
| Plataforma Omnicanal (WhatsApp, Instagram, GBM, Messenger) | $1,999.00 MXN |
| Incluye: 1,000 conversaciones servicio, 3 Agentes, Campañas masivas | Incluido |

#### Adicionales mensuales

| Concepto | Precio |
|----------|--------|
| Wizard Bot | $2,000.00 MXN |
| Integración API | $3,999.00 MXN |
| Versión Móvil | $1,999.00 MXN |
| Apple Business | $1,999.00 MXN |
| Repositorio de Información | $1,999.00 MXN |
| AMD — Gestión de Filas | $1,999.00 MXN |
| IA Pymes (<10K conv) | $2,999.00 MXN |
| IA Medianas (10K–50K conv) | $5,999.00 MXN |
| IA Grandes (50K–100K conv) | $9,999.00 MXN |
| Web Chat | $1,999.00 MXN |

#### Precios por agente adicional

| Rango | Precio x agente/mes |
|-------|-------------------|
| 1 – 20 agentes | $500.00 MXN |
| 21 – 30 agentes | $400.00 MXN |
| 31 – 50 agentes | $300.00 MXN |
| 51 – 100 agentes | $250.00 MXN |

#### Precios templates (rangos de volumen)

| Rango mensual | Marketing | Utilidad | OTP/Auth | Servicio |
|--------------|-----------|----------|----------|---------|
| 1 – 5,000 | $0.70 | $0.25 | $0.25 | $0.20 |
| 5,001 – 10,000 | $0.68 | $0.22 | $0.22 | $0.18 |
| 10,001 – 100,000 | $0.67 | $0.20 | $0.20 | $0.16 |
| 100,001 – 1,000,000 | $0.65 | $0.18 | $0.18 | $0.14 |

---

### Pestaña: Planes Comercial 2024 (POR PLAN)

| Concepto | Plan Business | Plan Enterprice | Plan Enterprice Pro |
|----------|:---:|:---:|:---:|
| **Setup (Pago Único)** | $1,999 | $1,999 | $1,999 |
| **Renta Mensual** | $5,999 | $15,999 | $19,999 |
| Plataforma Omnicanal (WA/FB/IG/Webchat) | ✓ | ✓ | ✓ |
| 1,000 conv. servicio incluidas | ✓ | ✓ | ✓ |
| Agentes incluidos | 5 | 10 | 15 |
| Módulo campañas masivas | ✓ | ✓ | ✓ |
| Wizard Bot (hasta 3 hrs config) | ✓ | ✓ | ✓ |
| Versión Móvil / Web App | ✗ | ✓ | ✓ |
| Asignación Automática de chats | ✗ | ✓ | ✓ |
| Integraciones API | ✗ | ✗ | ✓ |
| Repositorio de Información | ✗ | ✗ | ✓ |
| IA (hasta 10K conversaciones) | ✗ | ✗ | ✓ |
| Agente adicional (mensual) | $500 | $500 | $500 |

#### Templates para planes (precio por conversación)

| Tipo | Precio |
|------|--------|
| Plantilla Marketing | $0.99 MXN |
| Plantilla Utilidad | $0.64 MXN |
| Plantilla Autenticación | $0.58 MXN |
| Conversación de Servicio | $0.45 MXN |

---

## Estructura del MACHOTE (propuesta imprimible)

Secciones identificadas en `MACHOTE PROPUESTA COMERCIAL_BBOT CON DESARROLLO.docx`:

1. **Portada** — Logo, título, cliente, fecha, ciudad
2. **Descripción del servicio** — Texto fijo de la plataforma
3. **Alcance de la Plataforma Broadcaster Bot** — Implementación, operación, mensajería, puesta en marcha
4. **Alcance específico para [NOMBRE DEL CLIENTE]** — Personalizable
5. **INVERSIÓN** — Tabla dinámica con la cotización resultante
6. **Plan Anual Preferente** — Descuento 10%, cálculos anuales
7. **Consideraciones Comerciales** — Texto fijo legal/operativo
8. **Consideraciones del Desarrollo** — Aplica cuando hay desarrollo a la medida
9. **Aceptación** — Firma del cliente

---

## Decisiones de diseño para el cotizador

- **Producto inicial:** Broadcaster Bot
- **Tipos de cotización:**
  - `ON DEMAND` → usa precios de la pestaña "Cotizador" con selección granular
  - `POR PLAN` → usa precios de la pestaña "Planes Comercial 2024"
- **Output:** Propuesta imprimible en formato del MACHOTE, con la sección INVERSIÓN generada dinámicamente
- **Plan Anual Preferente:** 10% descuento en onboarding + mensualidades + 1 agente adicional sin costo
- **Tecnología:** Aplicación web HTML/CSS/JS standalone (sin servidor requerido)
