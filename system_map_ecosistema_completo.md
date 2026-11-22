# CalculaTuCasa.com / LeadInmo AI — System Map del Proyecto Completo (Captación, Redes, ManyChat, Web y Monetización B2B)

> **Última actualización:** 2026-11-22  
> **Modelo de Negocio:** Plataforma B2C de valoración gratuita de viviendas con IA (`CalculaTuCasa.com`) para captar propietarios vendedores cualificados y monetizarlos en formato B2B con agencias inmobiliarias por Código Postal (`LeadInmo AI`).

---

## 1. Mapa Visual del Ecosistema Completo (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       1. CANALES DE ENTRADA DE TRÁFICO                          │
│                                                                                 │
│  ┌──────────────────────────┐  ┌─────────────────────┐  ┌────────────────────┐  │
│  │ META ADS (IG + Facebook) │  │ GOOGLE SEARCH / MAPS│  │ BUZONEO QUIRÚRGICO │  │
│  │ • Post Gancho "VALORAR"  │  │ • "tasar piso..."   │  │ • Carta por CP con │  │
│  │ • Segmentación por CPs   │  │ • Tráfico directo   │  │   Código QR + UTM  │  │
│  └────────────┬─────────────┘  └──────────┬──────────┘  └─────────┬──────────┘  │
└───────────────┼───────────────────────────┼───────────────────────┼─────────────┘
                │ Comentario "VALORAR"      │                       │
                ▼                           │                       │
┌───────────────────────────────────────┐   │                       │
│   2. BOT CUALIFICADOR (ManyChat)      │   │                       │
│   Cuenta: @calculatucasa_com          │   │                       │
│                                       │   │                       │
│   ├─ Respuesta pública en el post     │   │                       │
│   ├─ DM 1: "🏠 Activar tasación"      │   │                       │
│   └─ DM 2: "¿En cuánto tiempo tienes  │   │                       │
│             pensado vender?"          │   │                       │
│      ├─ [🔥 En 1 a 3 meses] ──────────┼───┼───────────────────────┼──┐
│      ├─ [📅 En 3 a 6 meses] ──────────┼───┼───────────────────────┼──┤
│      └─ [📊 Solo saber valor] ────────┼───┼───────────────────────┼──┤
└───────────────────────────────────────┘   │                       │  │
                                            ▼                       ▼  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              3. PLATAFORMA WEB CON IA (https://calculatucasa.com)               │
│              Servidor Hetzner (2.29.187.251) · Coolify · Next.js 14             │
│                                                                                 │
│  Step 1: Dirección (Nominatim OSM)  ──► Step 2: m², estado, Cert. Energético    │
│  Step 3: Tasación en vivo (Gemini 2.5 Flash + POIs Overpass 600m)               │
│  Step 4: Captura del Teléfono (Precio difuminado + Cuenta atrás 10 min)         │
│  Step 5: Dashboard interactivo + Descarga del Informe Oficial en PDF (5 págs)   │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ Guarda Propiedad + Valoración + Lead + UTM
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              4. BASE DE DATOS & CRM ADMIN (PocketBase + /admin)                 │
│              https://pb.calculatucasa.com · https://calculatucasa.com/admin     │
│                                                                                 │
│  • Clasifica el Lead por urgencia (`utm_campaign`: 1-3 meses / 3-6 meses)       │
│  • Extrae el Código Postal de la dirección valorada                             │
│  • Cruza el CP con la tabla `zonas_inmobiliarias` y asigna la Agencia B2B       │
└───────────────────────────────────────┬─────────────────────────────────────────┘
                                        │ Entrega exclusiva por Código Postal
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│              5. MONETIZACIÓN B2B CON INMOBILIARIAS COLABORADORAS                │
│                                                                                 │
│  • Modelo A: Pago por Lead Cualificado (35 € - 80 € según urgencia)             │
│  • Modelo B: Cuota Fija Mensual por Exclusividad de Código Postal (150 - 300 €) │
│  • Modelo C: Híbrido (Coste base + 10% de comisión de agencia al vender)        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Mapa de Activos Digitales y Redes Sociales Configuradas

### 2.1 Página de Facebook (Fanpage)
- **Nombre Oficial:** `Calculatucasa.com - Valoración Inmobiliaria con IA`
- **Categoría:** `Inmobiliaria` (Tipo de página: `Empresa`)
- **Presentación (Bio General para toda España):**
  `Calcula gratis en 30 segundos cuánto vale hoy tu vivienda con Inteligencia Artificial y descarga tu Informe Oficial en PDF.`
- **Configuración operativa:**
  - **Sitio Web:** `https://calculatucasa.com`
  - **Botón CTA:** `ⓘ Más información` -> `https://calculatucasa.com`
  - **Horario:** `Siempre abierto (24h)`
  - **Foto de perfil:** `imagenes/foto_perfil_icono.png` (`1080x1080`, icono casa + calculadora)
  - **Foto de portada:** `imagenes/logo4.jpg`
  - **WhatsApp público:** Omitido intencionadamente para centralizar todo el flujo en el bot automático y la web.

### 2.2 Cuenta Profesional de Instagram
- **URL:** `https://www.instagram.com/calculatucasa_com/`
- **Usuario:** `@calculatucasa_com`
- **Tipo de cuenta:** `Profesional -> Empresa (Business)`
- **Categoría visible:** `Tasador inmobiliario`
- **Biografía activa (136/150 caracteres):**
  ```text
  🏠 Descubre gratis cuánto vale tu vivienda con IA
  📊 Informe PDF + Estudio de tu barrio en 30 seg
  👇 Calcula gratis en: calculatucasa.com
  ```
- **Información de contacto pública en perfil:** Desactivada (`Mostrar información de contacto: No`) para proteger privacidad y evitar llamadas manuales fuera del embudo.
- **Vinculación con Meta Business:** Conectada a la Página de Facebook dentro del **Portfolio Comercial `calculatucasa_com`**.
- **Publicación Gancho Activa (`imagenes/post_instagram_valorar.png`):**
  - Imagen `1080x1080` con titular *"¿CUÁNTO VALE HOY TU VIVIENDA?"*, 3 bloques de valor (Tasación IA 30s, Impacto Certificado Energético ±18.000 €, Informe PDF + Estudio de Barrio) y llamada a comentar **`"VALORAR"`**.

---

## 3. Mapa de Automatización en ManyChat (`@calculatucasa_com`)

**Estado:** `ACTIVO (Live)` en Plan Free (`0 €/mes`).

| Etapa del Flujo | Configuración Exacta en ManyChat | Acción / Resultado |
| :--- | :--- | :--- |
| **1. Disparador (Trigger)** | Comentario en la publicación gancho de Instagram con cualquiera de las palabras: `VALORAR, valorar, TASAR, tasar, PRECIO, precio, INFO, info` | Detecta al propietario interesado en el post o anuncio. |
| **2. Respuesta Pública en Comentarios** | 3 variaciones rotatorias: *"¡Hola! 👋 Ya te he enviado el enlace de valoración gratuita por mensaje privado (mira tus DMs)."* | Duplica los comentarios del post (baja el CPC en Meta Ads) y avisa al usuario. |
| **3. DM 1 (Apertura de ventana 24h)** | *"¡Hola! 👋 Soy el asistente de CalculaTuCasa.com. Haz clic en el botón de abajo para activar gratis el tasador con Inteligencia Artificial y descargar el Informe Oficial en PDF de tu vivienda 👇"* + Botón: **`🏠 Activar tasación gratis`** | Abre la ventana oficial de conversación en Instagram con 1 toque. |
| **4. DM 2 (Cualificación + Salto a Web)** | *"¡Perfecto! ✅ Ya tienes activado tu acceso gratuito al tasador con IA. Para abrir la calculadora y descargar tu Informe Oficial en PDF en 30 segundos, dime: **¿En cuánto tiempo tienes pensado vender tu vivienda? 👇**"* | Presenta los 3 botones que cualifican al usuario y abren la web en el mismo clic. |
| **5. Botones de Enlace con UTMs** | • **`🔥 En 1 a 3 meses`** → `https://calculatucasa.com/?utm_source=manychat&utm_campaign=venta_1_3_meses`<br>• **`📅 En 3 a 6 meses`** → `https://calculatucasa.com/?utm_source=manychat&utm_campaign=venta_3_6_meses`<br>• **`📊 Solo saber valor`** → `https://calculatucasa.com/?utm_source=manychat&utm_campaign=solo_curiosidad` | Abre `CalculaTuCasa.com` en el móvil (desde arriba del todo) e inyecta la urgencia de venta en la sesión del usuario. |

---

## 3B. Sistema de Entrega de Leads a Inmobiliarias (Telegram + WhatsApp 1-Clic)

1. **Bot Dedicado `@calculatucasa_leads_bot`:**
   - Notifica al instante al administrador (`TELEGRAM_CHAT_ID`) cada nuevo lead con su ficha completa: propietario, campaña (`manychat · venta_1_3_meses`), características del inmueble (`tipo`, `m²`, `habitaciones`, `ascensor`, `garaje/parking`, `jardín`, `certificado energético`), valoración IA y agencia asignada por Código Postal.
2. **Selector de 2 Modos en `https://calculatucasa.com/admin`:**
   - **`✋ Revisar y Reenviar` (Manual):** Envía la alerta a tu Telegram con un botón inline **`💬 Enviar lead por WhatsApp a [Agencia]`** (con prefijo `34` automático y ficha completa ya redactada). También disponible el botón **`💬 WhatsApp`** en cada fila de la tabla de `/admin`.
   - **`⚡ Automático a Agencia` (Piloto Automático):** Si la inmobiliaria tiene configurado su **`Telegram Chat ID`**, el bot le envía el lead directamente a su chat/grupo de Telegram y a ti te envía la confirmación de entrega.
3. **CRM Internacional de Inmobiliarias (`/admin` -> Gestión de Inmobiliarias):**
   - Directorio completo con `persona_contacto`, `telefono`, `email`, `direccion`, `pais`, `idioma`, `acuerdo` (tarifa), `telegram_chat_id` y `notas`, con ordenación y asignación de zonas por **Ciudad completa** (multi-CP) o **CP manual**.

---

## 4. Estructura de Costes y Unit Economics del Sistema

| Concepto | Coste | Frecuencia | Estado |
| :--- | :--- | :--- | :--- |
| **Servidor VPS Hetzner (`CAX11` 4 GB RAM + Coolify + PocketBase)** | **7,85 €** (IVA incl.) | Mensual | Activo (`2.29.187.251`) |
| **Dominio `calculatucasa.com` (Squarespace)** | **1,50 €** (18 €/año) | Mensual equiv. | Activo hasta Abr 2027 |
| **API Google Gemini 2.5 Flash (Google AI Studio)** | **0,00 €** | Mensual | Activo (Nivel Gratuito `...P06A`) |
| **Bot de Telegram (`@calculatucasa_leads_bot`)** | **0,00 €** | Mensual | Activo (Manual / Automático) |
| **ManyChat (Bot Instagram)** | **0,00 €** (Free) / **~14 €** (Pro opcional) | Mensual | Activo en Plan Free |
| **Inversión Publicitaria Meta Ads (Sabadell / Terrassa)** | **5 € a 10 € / día** | Variable (controlable) | Pendiente de activar en Fase 6 |
| **Coste Estimado de Adquisición por Lead (CPL)** | **3,50 € a 7,00 €** | Por propietario con teléfono | — |
| **Precio de Venta B2B a Inmobiliarias** | **35 € - 80 € / lead** (o **150 € - 300 €/mes** por CP exclusivo) | Por entrega / Mensual | — |

---

## 5. Roadmap de Expansión: Nuevos Imanes de Leads (Micro-Webs / Rutas) y Canales Futuros

Todas estas herramientas pueden integrarse como **rutas dentro de `calculatucasa.com`** (compartiendo el mismo servidor Hetzner, PocketBase, `/admin` y Bot de Telegram `@calculatucasa_leads_bot` a coste fijo 0 € adicional):

### 5.1 Calculadoras y Micro-Webs de Alta Intención Vendedora
1. **`/herencias` — Calculadora de Herencias + Sucesiones y Plusvalía:**
   - Calcula Impuesto de Sucesiones (por CC.AA.) + Plusvalía Municipal + tasación IA del inmueble y reparto neto entre herederos.
   - *Por qué:* El 70-80% de los pisos heredados se venden a corto plazo; leads de máximo valor para inmobiliarias.
2. **`/plusvalia` — Calculadora "¿Cuánto me queda LIMPIO si vendo?" (Plusvalía + IRPF + Hipoteca):**
   - Calcula el dinero neto final tras impuestos (IRPF por ganancia patrimonial, exenciones por >65 años o reinversión, Plusvalía Municipal) usando el precio estimado por la IA.
3. **`/alquilar-o-vender` — Simulador "¿Vender Hoy o Alquilar?" (Zonas Tensionadas):**
   - Compara rentabilidad neta real de alquiler (descontando IBI, comunidad, seguro de impago, IRPF y topes de alquiler) frente a liquidez inmediata por venta.
4. **`/reforma` — Calculadora "¿Reformo antes de vender o vendo tal cual?" (Doble Monetización B2B):**
   - Estima coste de reforma según m² y revalorización tras la obra. Permite monetizar el lead tanto con **inmobiliarias** como con **empresas de reformas**.
5. **`/certificado-energetico` — Simulador de Penalización Energética (Letras E/F/G):**
   - Muestra cuánto valor pierde el inmueble por baja eficiencia y qué mejoras económicas suben la calificación antes de vender.

### 5.2 Canales Adicionales de Captación (Sin Nuevas Calculadoras)
- **SEO Hiperlocal por Barrios (`/precio-m2/[ciudad]/[barrio]`):** Páginas indexables para tráfico orgánico gratuito en Google (*"Precio m² La Creu Alta Sabadell"*).
- **Alianzas Locales B2B2C:** Acuerdos con técnicos certificadores (cédulas/CEE), administradores de fincas y gestorías de herencias en el Vallès.
- **Buzoneo Quirúrgico con QR + UTM:** Cartas sobrias por código postal (`?utm_source=buzoneo&cp=08205`) enfocadas en propietarios mayores (55-75 años) fuera de Instagram.

### 5.3 Escalado Geográfico e Internacionalización (España → LATAM → Global)
La arquitectura actual (**Next.js + PocketBase + OpenStreetMap/Nominatim + Gemini 2.5 Flash + Meta Ads + WhatsApp/Telegram**) es global y el CRM (`/admin`) ya cuenta con el campo **`pais`** y asignación por ciudades/múltiples códigos postales (`AgenciesAdmin.tsx`).

1. **Nivel 1 — Toda España (Ya listo sin tocar código):**
   - Basta con cambiar la segmentación geográfica en Meta Ads y dar de alta agencias de nuevas ciudades/CPs en `/admin`.
2. **Nivel 2 — Latinoamérica y mercado hispano de EE. UU. (Cambios mínimos):**
   - Quitar o hacer dinámico `countrycodes=es` en Nominatim (`app/api/lead/route.ts` y `app/admin/AdminMap.tsx`).
   - Hacer dinámicos la moneda (`€` / `es-ES` → `USD`, `MXN`, etc.) y el prefijo telefónico por defecto (`34` → dinámico según país) en `app/api/lead/route.ts` y `app/admin/LeadsTable.tsx`.
   - Adaptar el prompt de Gemini al país/moneda de la dirección (y soportar `sq ft` además de `m²` en EE. UU.).
   - La marca **`CalculaTuCasa.com`** funciona directamente en todo el mercado hispanohablante.
3. **Nivel 3 — Expansión Internacional Multi-idioma (EE. UU., UK, Francia, etc.):**
   - Añadir capa multi-idioma (`i18n`) para el formulario web y el informe PDF, detección automática de país/moneda y rutas o dominios locales (`/es`, `/mx`, `/us`, `/uk`).

---

## 6. Índice de Documentación del Proyecto en la Carpeta `ValorExacto`

| Archivo | Ubicación | Contenido |
| :--- | :--- | :--- |
| **[system_map.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/system_map.md)** | Raíz (`ValorExacto/`) | Mapa técnico completo de la aplicación web Next.js 14, APIs, motor Gemini, generador PDF, esquema PocketBase y changelog de código. |
| **[system_map_ecosistema_completo.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/system_map_ecosistema_completo.md)** | Raíz (`ValorExacto/`) | Este documento: mapa global del negocio, redes sociales, flujo ManyChat, UTMs y monetización B2B. |
| **[CREDENCIALES_SERVIDOR.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/CREDENCIALES_SERVIDOR.md)** | Raíz (`ValorExacto/`, ignorado en Git) | Todas las URLs, IPs, usuarios y contraseñas de Hetzner, Coolify, PocketBase, `/admin` e Instagram. |
| **[Checklist_Paso_a_Paso_Lanzamiento.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/Estrategias%20lanzamiento/Checklist_Paso_a_Paso_Lanzamiento.md)** | `Estrategias lanzamiento/` | Checklist interactivo de 7 fases (Fases 1 a 5 completadas; siguiente paso: Fase 6 — Meta Ads Manager). |
| **[Manual_Operativo_Cuentas_ManyChat_MetaAds_y_Costes.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/Estrategias%20lanzamiento/Manual_Operativo_Cuentas_ManyChat_MetaAds_y_Costes.md)** | `Estrategias lanzamiento/` | Manual operativo detallado clic a clic de cuentas profesionales, ManyChat, Meta Ads y costes. |
| **[Guia_Paso_a_Paso_Embudo_Hibrido_ManyChat_Web.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/Estrategias%20lanzamiento/Guia_Paso_a_Paso_Embudo_Hibrido_ManyChat_Web.md)** | `Estrategias lanzamiento/` | Explicación estratégica del Embudo Híbrido ManyChat + Web + Panel `/admin`. |
