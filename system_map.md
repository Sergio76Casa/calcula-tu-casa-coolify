# ValorExacto (CalculaTuCasa.com) — System Map (Web & Arquitectura Técnica)

> **Última actualización:** 2026-11-22  
> **Stack:** Next.js 14.2 (App Router · TypeScript · Tailwind CSS · Standalone Docker) + PocketBase v0.42.2 + Google Gemini 2.5 Flash + Leaflet + jsPDF + Meta Pixel  
> **Entorno de Producción:** VPS Hetzner Cloud (`CAX11` Arm64 · Ubuntu 24.04 · `2.29.187.251`) orquestado con **Coolify v4.7.5** y proxy SSL Let's Encrypt  
> **Dominios activos:** `https://calculatucasa.com` (Web) · `https://pb.calculatucasa.com` (PocketBase API & Admin)

---

## 1. Arquitectura General de la Web App

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND & SSR (Next.js 14.2 App Router)               │
│                                                                            │
│  src/middleware.ts (Test A/B Cookie `ab_variant` + Tracking)               │
│  app/layout.tsx (MetaPixel + Estilos Globales)                             │
│                                                                            │
│  Vistas Públicas:                                                          │
│   • / (app/page.tsx → app/HomeClient.tsx) — Embudo de Valoración en 5 pasos│
│   • /informe (app/informe/page.tsx)       — Visor de informe compartido    │
│   • /roadmap (app/roadmap/page.tsx)       — Simulador y guías internas     │
│                                                                            │
│  Vista Protegida:                                                          │
│   • /admin (app/admin/page.tsx → LoginGate → AdminDashboard.tsx)           │
└────────────────────────────────────────────────────────────────────────────┘
         │ Fetch interno (/api/*)
         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     CAPA DE API (Next.js Route Handlers)                   │
│                                                                            │
│  • POST /api/valorar             → Tasación IA + Geocoding + POIs + Caché  │
│  • POST /api/enriquece-propiedad → Re-cálculo de entorno y análisis barrio │
│  • POST /api/lead                → Registro de Lead + Alerta Telegram      │
│  • GET  /api/entorno             → Consulta POIs Overpass OpenStreetMap    │
│  • GET  /api/stats               → Contador diario de valoraciones         │
│  • GET  /api/banners             → Banners Social Proof activos por CP     │
│  • GET  /api/names               → Nombres reales para Social Proof Toast  │
└──────────────┬─────────────────────────────────────────┬───────────────────┘
               │ REST API (/api/collections/*)           │ HTTPS REST
               ▼                                         ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│      POCKETBASE v0.42.2 (BaaS)       │  │   SERVICIOS EXTERNOS & IA        │
│      https://pb.calculatucasa.com    │  │                                  │
│                                      │  │ • Google Gemini 2.5 Flash API    │
│ • propiedades                        │  │   (Tasación, Barrio, Fallback)   │
│ • valoraciones                       │  │ • Nominatim OSM (Geocodificación)│
│ • leads                              │  │ • Overpass API (POIs del barrio) │
│ • inmobiliarias                      │  │ • Meta Pixel (2150212962186590)  │
│ • zonas_inmobiliarias                │  │ • Telegram Bot API (Alertas Lead)│
│ • social_proof_banners               │  └──────────────────────────────────┘
│ • social_proof_names                 │
└──────────────────────────────────────┘
```

---

## 2. Navegación, Rutas y Flujo de Usuario

| Ruta URL | Acceso | Componente Raíz | Descripción y Parámetros Soportados |
| :--- | :--- | :--- | :--- |
| `/` | Pública | `app/page.tsx` → `app/HomeClient.tsx` | Embudo interactivo de 5 pasos. Lee automáticamente parámetros URL de campañas: `?utm_source=`, `?utm_campaign=` y `?utm_name=` (pre-rellena el nombre del propietario en el paso 4). |
| `/admin` | Protegida (`LoginGate`) | `app/admin/page.tsx` → `AdminDashboard.tsx` | Panel CRM de gestión de Leads, mapa de propiedades valoradas, asignación automática de inmobiliarias por Código Postal, exportación CSV, gestión de Banners por CP y nombres de Social Proof. |
| `/informe` | Pública | `app/informe/page.tsx` | Vista de consulta y descarga de un informe de valoración específico. |
| `/roadmap` | Pública / Interna | `app/roadmap/page.tsx` | Herramienta interna con simulador de rentabilidad (`ProfitabilitySimulator`), generador de copies (`CopyGenerator`) y guías de configuración. |

### Los 5 Pasos del Embudo en `app/HomeClient.tsx`:
1. **`Step 1` (`HeroSection.tsx` + `AddressInput.tsx`):** Autocompletado de dirección en España con Nominatim OSM y vista previa en mapa (`MapPreview.tsx`). Dispara evento de Meta Pixel `IniciarValoracion`. *(Optimizado para móvil: sin `autoFocus` y alineado arriba con `scrollTo(0, 0)` en cada cambio de paso).*
2. **`Step 2` (`PropertyDetailsStep.tsx`):** Captura rápida de `m2`, `estado` (*reformado, bueno, a reformar*), `tipo` (*piso, casa*), `habitaciones`, extras condicionales (`ascensor` en pisos y casas, `garaje` / `plaza de parking` en pisos y casas, `jardin` en casas) y `energyCertificate` (A-G).
3. **`Step 3` (`LoadingValuationStep.tsx`):** Pantalla animada de análisis por IA que invoca `POST /api/valorar`.
4. **`Step 4` (`LeadCaptureStep.tsx`):** Muro de desbloqueo con precio difuminado (`PriceTease`), testimonios rotatorios, cuenta atrás de 10 minutos y formulario de captura (`nombre` pre-rellenado desde `utm_name`, `telefono` obligatorio, `email` opcional). Invoca `POST /api/lead`.
5. **`Step 5` (`ValuationDashboard.tsx`):** Dashboard final con precio sugerido, rango mínimo/máximo, alquiler estimado, rentabilidad bruta, tiempo estimado de venta, impacto energético (`EnergyScale.tsx`), análisis de servicios del barrio (`NeighbourhoodDetail.tsx`), botón de generación de **Informe Oficial en PDF de 5 páginas** (`generatePDF.ts`) y modal de contacto con agencia (`SellModal.tsx`).

---

## 3. Mapa Completo de Archivos y Módulos

### 3.1 Frontend — Landing y Embudo (`src/components/landing/` y `src/components/`)
| Archivo | Responsabilidad |
| :--- | :--- |
| `app/HomeClient.tsx` | Orquestador de estados del embudo (`step 1..5`), lectura de `utm_source`, `utm_campaign`, `utm_name`, control de idioma (`es`, `ca`, `en`) y scroll automático al inicio en cada paso. |
| `src/components/landing/HeroSection.tsx` | Cabecera principal con contador de valoraciones en vivo (`/api/stats`), soporte Test A/B (`variant A/B`) y formulario de dirección. |
| `src/components/landing/AddressInput.tsx` | Buscador con debounce (420 ms) contra Nominatim OpenStreetMap (`countrycodes=es`), botón de **Geolocalización GPS en 1 clic (`handleLocateMe`)** con geocodificación inversa (`nominatim/reverse`) y previsualización automática de coordenadas en `MapPreview.tsx`. |
| `src/components/landing/PropertyDetailsStep.tsx` | Paso 2: selectores táctiles de m², habitaciones, tipo de inmueble, estado de conservación, extras y certificado energético. |
| `src/components/landing/LoadingValuationStep.tsx` | Paso 3: barra de progreso por etapas y llamada asíncrona a `POST /api/valorar`. |
| `src/components/landing/LeadCaptureStep.tsx` | Paso 4: teaser del precio calculado, pre-llenado de `prefillName` (`utm_name`), validación de teléfono español y envío a `POST /api/lead`. |
| `src/components/landing/ValuationDashboard.tsx` | Paso 5: visualización completa del informe, descarga del PDF con `jsPDF` y llamada opcional en segundo plano a `/api/enriquece-propiedad`. |
| `src/components/landing/SellModal.tsx` | Modal de confirmación para propietarios que solicitan contacto directo con la agencia colaboradora de su zona. |
| `src/components/MetaPixel.tsx` | Inicialización del Pixel de Meta (`NEXT_PUBLIC_META_PIXEL_ID`) y helper `trackPixelEvent`. |
| `src/components/SocialProofToast.tsx` | Notificaciones flotantes en tiempo real (*"María en Sabadell acaba de valorar su vivienda"*) alimentadas por `/api/banners` y `/api/names`. |
| `src/components/ExitIntentModal.tsx` | Modal de retención cuando el usuario intenta abandonar la página antes de completar la valoración. |
| `src/components/EnergyScale.tsx` | Escala visual A-G del Certificado de Eficiencia Energética y su impacto económico en la tasación. |

### 3.2 Panel de Administración CRM (`app/admin/`)
| Archivo | Responsabilidad |
| :--- | :--- |
| `app/admin/page.tsx` | Punto de entrada de `/admin` protegido por `LoginGate.tsx`. |
| `app/admin/LoginGate.tsx` | Autenticación del administrador (`info@thelusacia.com` / `123456`). |
| `app/admin/AdminDashboard.tsx` | Carga en paralelo desde PocketBase de `leads` (con `expand: propiedad_id`), `valoraciones` y `zonas_inmobiliarias` (con `expand: inmobiliaria_id`). Cruza automáticamente el Código Postal de cada propiedad con la inmobiliaria asignada a esa zona. |
| `app/admin/LeadsTable.tsx` | Tabla filtrable y paginada de Leads con 12 columnas (incluyendo **Campaña UTM**, **Estado de Envío**, **Inmobiliaria Asignada por CP** y exportador a **CSV**). |
| `app/admin/MetricsRow.tsx` | KPIs superiores del panel (Total Leads, Valoraciones, Precio Medio, Conversión). |
| `app/admin/AdminMap.tsx` | Mapa interactivo Leaflet con chinchetas de todas las propiedades valoradas y leads captados. |
| `app/admin/AgenciesAdmin.tsx` & `ZonesTab.tsx` | CRUD completo para dar de alta/editar **Inmobiliarias colaboradoras** (con ordenación A-Z/Z-A/estado) y asignarles zonas por **Ciudad completa o CP manual**, mostrando la tabla agrupada por inmobiliaria (plegada por defecto con contador de CPs y desplegable bajo clic). |
| `app/admin/BannersAdmin.tsx` & `BannerForm.tsx` | Gestión de localidades y códigos postales activos para el sistema de Social Proof (59 municipios del área metropolitana de Barcelona precargados). |
| `app/admin/NamesAdmin.tsx` | Gestión de la lista de nombres utilizados en las notificaciones de Social Proof (`social_proof_names`). |

### 3.3 Motor de Valoración con IA (`src/lib/valorar/` y `app/api/valorar/route.ts`)
| Archivo | Responsabilidad |
| :--- | :--- |
| `app/api/valorar/route.ts` | Endpoint principal `POST /api/valorar`. Soporta modo estándar web (con caché en BD, geocodificación, Overpass POIs y análisis de barrio) y modo ultrarrápido `source: "manychat"` (< 9s, guardado en BD en background). |
| `src/lib/valorar/geminiClients.ts` | Clientes HTTP hacia `gemini-2.5-flash` con `responseSchema` estricto en JSON: `callGemini` (tasación completa), `callGeminiManyChat` (`thinkingBudget: 0` para respuesta rápida), `callGeminiBarrio` (análisis cualitativo del barrio) y `callGeminiEntornoFallback` (simulación de POIs si Overpass falla). |
| `src/lib/valorar/prompts.ts` | Construcción de los prompts de ingeniería inmobiliaria con reglas de ajuste por estado, planta/ascensor, terraza/jardín y letra de certificado energético. |
| `src/lib/valorar/schemas.ts` | Esquemas JSON (`valuationSchema`, `barrioSchema`, `entornoFallbackSchema`) exigidos a la API de Gemini. |
| `src/lib/valorar/geocoding.ts` | Geocodificación primaria con Nominatim OSM y fallback automático con Gemini (`geminiGeocoding`) si la dirección es ambigua. |
| `src/lib/valorar/cache.ts` | Búsqueda de valoraciones previas idénticas en PocketBase (`buscarValoracionEnCache`) para ahorrar llamadas a la IA y persistencia en `propiedades` y `valoraciones`. |
| `src/lib/entorno.ts` | Consulta multi-espejo a Overpass API (`overpass-api.de`, `openstreetmap.fr`, `kumi.systems`) en un radio de 600 m para extraer colegios, supermercados, farmacias, transporte, parques, restaurantes, gasolineras y centros de salud. |

### 3.4 Motor Generador de Informes PDF (`src/lib/generatePDF.ts` y `src/lib/pdf/`)
| Archivo | Responsabilidad |
| :--- | :--- |
| `src/lib/generatePDF.ts` | Punto de entrada que ensambla y descarga el PDF oficial en el navegador del cliente con `jsPDF`. |
| `src/lib/pdf/pages/pdfCover.ts` | Página 1: Portada corporativa con logotipo, dirección del inmueble y fecha de emisión. |
| `src/lib/pdf/pages/pdfValuation.ts` | Página 2: Precio estimado de venta, horquilla de negociación, precio/m² y argumentario técnico de la IA. |
| `src/lib/pdf/pages/pdfFinancial.ts` | Página 3: Estudio financiero de inversión (alquiler mensual estimado, rentabilidad bruta anual %, score de inversión 1-10 y escala energética). |
| `src/lib/pdf/pages/pdfMarket.ts` | Página 4: Puntos fuertes del inmueble, puntos a mejorar, tendencia a 12 meses y estrategia de precio de salida. |
| `src/lib/pdf/pages/pdfNeighbourhood.ts` | Página 5: Radiografía del barrio y desglose de servicios cercanos (colegios, transporte, salud, comercios). |

---

## 4. Modelo de Datos en PocketBase (`https://pb.calculatucasa.com`)

Todas las colecciones están desplegadas en **PocketBase v0.42.2** con campos `autodate` (`created` y `updated`) y conectadas mediante `src/lib/pocketbase.ts` (servidor, autenticado como superusuario) y `src/lib/pocketbase-client.ts` (cliente público):

| Colección | ID | Campos Principales | Función en el Sistema |
| :--- | :--- | :--- | :--- |
| **`propiedades`** | `abc123propiedad` | `direccion_completa`, `m2_construidos`, `estado_conservacion`, `tipo_propiedad`, `habitaciones`, `ascensor`, `jardin`, `garaje`, `certificado_energetico`, `entorno_json` | Almacena cada inmueble consultado y el JSON de puntos de interés de su entorno. |
| **`valoraciones`** | `abc123valoracio` | `propiedad_id` (relación), `precio_sugerido`, `rango_minimo`, `rango_maximo`, `precio_m2_zona`, `rentabilidad_bruta_pct`, `precio_alquiler_estimado`, `tiempo_venta_estimado_dias`, `tendencia_mercado_12m`, `score_inversion`, `analisis_gemini`, `analisis_barrio_json` | Guarda el resultado económico y cualitativo generado por Gemini 2.5 Flash para una propiedad. |
| **`leads`** | `abc123leads0000` | `propiedad_id` (relación), `nombre`, `telefono`, `email` (opcional), `origen`, `utm_source`, `utm_campaign`, `ab_variant`, `acepta_terminos`, `quiere_vender` | Registra los datos personales del propietario junto con la campaña (`venta_1_3_meses`, `venta_3_6_meses`, `solo_curiosidad`). |
| **`inmobiliarias`** | `pbc_1555908101` | `nombre`, `persona_contacto`, `telefono`, `email`, `direccion`, `pais`, `idioma`, `acuerdo`, `notas`, `telegram_chat_id`, `estado` (bool) | Agencias inmobiliarias clientes (B2B) internacionales con ficha CRM completa, tarifa y Telegram opcional. |
| **`app_config`** | *(base)* | `key`, `value` | Configuración persistente del panel `/admin` (incluye `lead_delivery_mode`: `manual` \| `auto`). |
| **`zonas_inmobiliarias`** | `pbc_4151933017` | `codigo_postal`, `inmobiliaria_id` (relación) | Asigna códigos postales específicos (ej. `08205`, `08220`) a cada inmobiliaria activa. |
| **`social_proof_banners`** | `abc123banners00` | `location_name`, `postal_codes` (JSON array), `is_active` | 59 municipios del área metropolitana de Barcelona y Vallès con sus códigos postales. |
| **`social_proof_names`** | *(base)* | `name` | Lista de 30 nombres reales para las notificaciones de Social Proof. |

---

## 5. Registro de Cambios Recientes en Producción (Changelog)

1. **[2026-11-16] Despliegue en Hetzner Cloud + Coolify v4.7.5 (`commit 0b45c94`):**
   - Creación del servidor `CAX11` (`2.29.187.251`) con 2 GB de Swap adicional e instalación de Coolify.
   - Activación de `output: 'standalone'` en `next.config.js` y soporte de `NEXT_PUBLIC_META_PIXEL_ID` en `Dockerfile`.
   - Despliegue de PocketBase v0.42.2, migración completa de las 7 colecciones desde `pb_schema.json`, creación de inmobiliarias iniciales y población de los 59 municipios en `social_proof_banners`.
   - Configuración de DNS en Squarespace (`@`, `pb`, `www`) y activación de certificados SSL Let's Encrypt en `https://calculatucasa.com` y `https://pb.calculatucasa.com`.
2. **[2026-11-18] Actualización de Motor IA Gemini 2.5 Flash:**
   - Sustitución de la clave de prepago agotada por la API Key activa de Google AI Studio (`...P06A`) en `.env.local` y en Coolify, verificando tasación completa `HTTP 200 OK`.
3. **[2026-11-21] Optimización de Experiencia Móvil para Tráfico desde Instagram/ManyChat (`commit aa7f345`):**
   - Eliminado el atributo `autoFocus` en `src/components/landing/AddressInput.tsx` que provocaba que los navegadores móviles hicieran scroll automático a la mitad de la página al abrir el enlace desde Instagram.
   - Añadido `window.scrollTo(0, 0)` en `app/HomeClient.tsx` en la carga inicial y en cada cambio de paso (`step 1..5`).
   - Ajustada la alineación vertical en móvil (`items-start md:items-center`, `pt-14 pb-12 md:py-24`) en `src/components/landing/HeroSection.tsx` para que el titular y el buscador se vean completos desde arriba en pantallas de teléfono.
4. **[2026-11-21] Optimización Ultrarrápida y Robustez JSON del Motor IA Gemini 2.5 Flash:**
   - Activado `thinkingConfig: { thinkingBudget: 0 }` y extractor seguro `extractJsonObject()` en todas las funciones de `src/lib/valorar/geminiClients.ts` (`callGemini`, `callGeminiBarrio`, `callGeminiEntornoFallback`) y `src/lib/valorar/geocoding.ts` (`geminiGeocoding`), reduciendo el tiempo de tasación de ~48 s a ~5 s y eliminando errores de parseo JSON.
   - Añadido fallback de dirección sin número de portal en `nominatimGeocoding` y cabeceras `User-Agent` / `Accept` en `src/lib/entorno.ts` para Overpass API.
   - Paralelizada la llamada principal de tasación (`callGemini`) junto con la geocodificación y extracción de entorno en `app/api/valorar/route.ts`.
5. **[2026-11-21] Botón de Geolocalización GPS en Buscador de Dirección (`src/components/landing/AddressInput.tsx`):**
   - Añadido botón GPS (`IconLocate`) a la derecha del campo de dirección que obtiene las coordenadas del dispositivo (`navigator.geolocation.getCurrentPosition`), realiza geocodificación inversa en Nominatim (`buildReverseAddress`), autorrellena `Calle + Número, Municipio, CP` y despliega automáticamente el mapa `MapPreview`.
6. **[2026-11-21] Corrección de Mapas (`MapPreview.tsx` y `AdminMap.tsx`):**
   - Sustituidos los tiles de `basemaps.cartocdn.com` (que devolvían marca de agua `API KEY REQUIRED`) por los tiles gratuitos de **OpenStreetMap** (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`) con filtro CSS dark-mode en `app/globals.css` (`.leaflet-tile-pane`).
7. **[2026-11-21] Corrección de Auto-Cancelación en PocketBase Client (`src/lib/pocketbase-client.ts`):**
   - Añadido `pbClient.autoCancellation(false)` para evitar que las peticiones concurrentes de `AdminDashboard` y `AgenciesAdmin` sobre `zonas_inmobiliarias` se cancelen entre sí y dejen vacía la lista de inmobiliarias en `/admin`.
8. **[2026-11-21] Asignación de Zonas por Ciudad y Selección Múltiple de CPs (`app/admin/AgenciesAdmin.tsx` y `app/admin/ZonesTab.tsx`):**
   - Añadido selector de **Ciudad / Municipio** (alimentado desde `social_proof_banners`) que muestra todos sus Códigos Postales con casillas seleccionables (`Todos` / `Ninguno` o CPs sueltos), indicador de CPs ya asignados y opción de CP manual.
   - Agrupada la tabla de zonas por inmobiliaria (1 fila plegada por agencia con contador de CPs, desplegable para ver o quitar CPs individuales) y añadida ordenación (A-Z, Z-A, Más CPs/Activas) en ambas pestañas.
9. **[2026-11-21] Directorio CRM Internacional de Inmobiliarias (`PocketBase` + `app/admin/AgenciesAdmin.tsx`):**
   - Ampliada la colección `inmobiliarias` en PocketBase con 6 nuevos campos (`persona_contacto`, `direccion`, `pais`, `idioma`, `acuerdo`, `notas`).
   - Añadidos estos campos al formulario de alta/edición (con botón **Editar** en cada fila) y ordenación por País.
10. **[2026-11-22] Bot Dedicado de Telegram + Selector Manual/Automático + Botón WhatsApp (`app/api/lead/route.ts`, `AdminDashboard.tsx`, `LeadsTable.tsx`, `AgenciesAdmin.tsx`):**
   - Conectado el nuevo bot dedicado `@calculatucasa_leads_bot` (`TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`) en Coolify.
   - Añadida colección `app_config` (`lead_delivery_mode`: `manual` | `auto`) y campo `telegram_chat_id` en `inmobiliarias`.
   - Añadido selector **✋ Revisar y Reenviar** / **⚡ Automático a Agencia** en `/admin` y botón directo **`💬 WhatsApp`** (con ficha completa del inmueble y valoración IA) en Telegram y `/admin`.
11. **[2026-11-22] Ascensor en Casas + Garaje/Parking en Pisos y Casas (`PropertyDetailsStep.tsx`, `prompts.ts`, `PocketBase`):**
   - Añadido el campo `garaje` en PocketBase (`propiedades`), en el caché (`cache.ts`), en el normalizador (`normalizer.ts`) y en las alertas de Telegram/WhatsApp.
   - En el formulario paso 2 (`PropertyDetailsStep.tsx`): los pisos muestran **Ascensor** y **Plaza de parking**, y las casas muestran **Jardín**, **Ascensor** y **Garaje**.
   - Actualizado `buildPrompt` (`prompts.ts`) para que Gemini 2.5 Flash sume el valor real de mercado del garaje/parking y del ascensor (en pisos y casas) y lo justifique en el argumentario.
12. **[2026-11-22] Email Opcional en Leads y Visibilidad de Campaña UTM (`PocketBase`, `pb_schema.json`, `LeadsTable.tsx`):**
   - Cambiado `leads.email` a `required: false` en PocketBase y `pb_schema.json` para permitir capturas solo con nombre y teléfono sin error.
   - Añadida etiqueta visible de campaña (`venta_1_3_meses`, `venta_3_6_meses`, `manychat`) en la columna `URGENCIA` de `/admin` y en las notificaciones de Telegram.

---

## 6. Roadmap Técnico Futuro (Rutas Planificadas en Next.js)

*(Detallado a nivel de negocio en [system_map_ecosistema_completo.md](file:///c:/Users/USER/Desktop/Proyectos%20Antigravity/ValorExacto/system_map_ecosistema_completo.md#L139))*
- `/herencias`: Calculadora fiscal de sucesiones + plusvalía + valoración IA conectada a `POST /api/valorar` y `POST /api/lead`.
- `/plusvalia`: Calculadora de beneficio neto tras IRPF, plusvalía municipal e hipoteca.
- `/alquilar-o-vender`: Comparador financiero de rentabilidad neta de alquiler vs venta inmediata.
- `/reforma`: Estimador coste de reforma vs revalorización (doble monetización: inmobiliarias y reformas).
- `/precio-m2/[ciudad]/[barrio]`: Páginas SEO programáticas hiperlocales conectadas al embudo principal.
