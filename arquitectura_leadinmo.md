# Blueprint: Proyecto LeadInmo AI / CalculaTuCasa.com

## Descripción General
Plataforma de captación de leads inmobiliarios (B2C: CalculaTuCasa.com) mediante valoraciones gratuitas impulsadas por IA, para su posterior venta a agencias inmobiliarias (B2B: LeadInmo AI).

## Stack Tecnológico
- Frontend: Antigravity
- Backend/Base de Datos: Supabase (PostgreSQL)
- IA: Google Gemini API (vía Supabase Edge Functions)

## Regla de Oro del Proyecto
**Prohibido crear archivos de código que superen las 300 líneas.** Si un componente, vista o función excede este límite, debe ser refactorizado y dividido en módulos más pequeños inmediatamente.

## Flujo de Usuario (Frontend)
1. Usuario introduce dirección en el Hero Section.
2. Se solicitan m2 y estado de la vivienda.
3. Pantalla de carga simulando análisis.
4. Captura de Lead (Teléfono/Email) para entregar el resultado final.

## Modelo de Datos (Supabase)
- `propiedades`: id, direccion, m2, estado.
- `leads`: id, propiedad_id, nombre, telefono, email.
- `valoraciones`: id, propiedad_id, precio_estimado, analisis_gemini (JSON).