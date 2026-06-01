# Plan de Implementación: Inmobiliarias Mock y Columnas de Envío en Leads

Este plan detalla los pasos para agregar dos inmobiliarias mock en la base de datos de PocketBase y actualizar la interfaz del administrador para mostrar el estado de envío de los leads, la inmobiliaria asignada, y el día/hora del envío.

## 🏢 1. Inyección de Datos Mock en PocketBase
Registrar dos inmobiliarias colaboradoras y sus zonas asignadas:
* **Don Piso Sabadell** asignada al CP `08205`.
* **Finques Centre Terrassa** asignada al CP `08220`.

Se ejecutó el script `scratch/clear_and_create_mock.js` para limpiar registros huérfanos anteriores y crear estos registros con el esquema correcto de PocketBase v0.22+ (usando el campo `fields` en lugar de `schema`).

## 💻 2. Modificaciones en el Código Front-end

### A. AdminDashboard.tsx
* Se obtiene la lista completa de `zonas_inmobiliarias` con la relación expandida de `inmobiliaria_id`.
* Se mapea cada lead con su agencia correspondiente comparando el CP de la dirección con las zonas asignadas.
* Se agregan las propiedades `assigned_agency` y `sent_status` al objeto plano de cada lead.

### B. LeadsTable.tsx
* Se agregaron los atributos `assigned_agency` y `sent_status` a la interfaz `LeadRow`.
* Se añadió la columna "Envío" en la tabla para mostrar un Badge de estado ("Enviado" o "No enviado"), el nombre de la inmobiliaria asignada y el día/hora del envío.
* Se ajustó el layout de la tabla (`colgroup` y `table-fixed`) para acomodar la nueva columna.
* Se modificó el `colSpan` de la fila de "Sin resultados" a 12.
* Se actualizó el exportador CSV para incluir las nuevas columnas ("Estado Envío", "Agencia Asignada", "Fecha Envío").

---

## 📈 Plan de Verificación y Responsividad Móvil
1. **Ejecución del Script:** Verificado y completado con éxito.
2. **Responsividad en Teléfono:**
   - La tabla de Leads cuenta con un contenedor con scroll horizontal bloqueado o controlado para evitar roturas visuales en teléfonos móviles.
   - El panel general utiliza un sistema de columnas responsivas de Tailwind CSS (`grid lg:grid-cols-12 gap-6`, etc.) para apilarse verticalmente en móviles y mostrarse en cuadrícula en pantallas grandes.
