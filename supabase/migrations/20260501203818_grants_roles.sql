-- ============================================================
-- LeadInmo AI — Grants de privilegios por rol
-- RLS controla QUÉ filas se ven; GRANT controla QUÉ operaciones
-- están permitidas a nivel de tabla. Ambas capas son necesarias.
-- ============================================================

-- propiedades: anon inserta, authenticated lee
GRANT INSERT          ON TABLE public.propiedades TO anon;
GRANT SELECT          ON TABLE public.propiedades TO authenticated;

-- leads: anon solo inserta, authenticated sin acceso
GRANT INSERT          ON TABLE public.leads TO anon;

-- valoraciones: todos pueden leer, solo service_role inserta
GRANT SELECT          ON TABLE public.valoraciones TO anon;
GRANT SELECT          ON TABLE public.valoraciones TO authenticated;
