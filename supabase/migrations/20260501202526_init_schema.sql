-- ============================================================
-- LeadInmo AI — Migración inicial
-- Tablas: propiedades · leads · valoraciones
-- Seguridad: RLS activado en las tres tablas
-- ============================================================


-- ============================================================
-- TABLA: propiedades
-- Datos físicos del inmueble. Creada por el anónimo desde
-- el formulario de valoración de CalculaTuCasa.com.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.propiedades (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    direccion_completa  TEXT          NOT NULL,
    m2_construidos      NUMERIC(10,2) NOT NULL CHECK (m2_construidos > 0),
    estado_conservacion TEXT          NOT NULL
                            CHECK (estado_conservacion IN
                                ('nuevo', 'bueno', 'regular', 'a_reformar')),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;

-- Anónimos crean la propiedad al enviar el formulario de captación
CREATE POLICY "propiedades: anon puede insertar"
    ON public.propiedades
    FOR INSERT TO anon
    WITH CHECK (true);

-- Agentes y admins autenticados pueden consultar el listado
CREATE POLICY "propiedades: auth puede leer"
    ON public.propiedades
    FOR SELECT TO authenticated
    USING (true);


-- ============================================================
-- TABLA: leads
-- Datos personales del usuario (GDPR crítico).
-- Lectura bloqueada para todos los roles cliente.
-- Solo service_role (Edge Functions) puede leer y gestionar.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    propiedad_id UUID        NOT NULL
                     REFERENCES public.propiedades (id) ON DELETE CASCADE,
    nombre       TEXT        NOT NULL,
    telefono     TEXT        NOT NULL,
    email        TEXT        NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anónimos pueden enviar sus datos (formulario de captación)
CREATE POLICY "leads: anon puede insertar"
    ON public.leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- BLOQUEO TOTAL DE LECTURA para anon y authenticated.
-- No existe ninguna política SELECT para estos roles.
-- service_role bypassa RLS y accede sin restricciones.


-- ============================================================
-- TABLA: valoraciones
-- Resultado del análisis de Gemini. Generada exclusivamente
-- por la Edge Function (service_role). Los clientes solo leen.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.valoraciones (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    propiedad_id     UUID          NOT NULL
                         REFERENCES public.propiedades (id) ON DELETE CASCADE,
    precio_estimado  NUMERIC(15,2) NOT NULL CHECK (precio_estimado > 0),
    analisis_gemini  JSONB,        -- payload completo de respuesta Gemini
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE public.valoraciones ENABLE ROW LEVEL SECURITY;

-- Anónimos y autenticados pueden leer el resultado de su valoración
CREATE POLICY "valoraciones: todos pueden leer"
    ON public.valoraciones
    FOR SELECT TO anon, authenticated
    USING (true);

-- Solo service_role puede insertar valoraciones (vía Edge Function)


-- ============================================================
-- FUNCIÓN y TRIGGERS: mantener updated_at al día
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_propiedades_updated_at
    BEFORE UPDATE ON public.propiedades
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_valoraciones_updated_at
    BEFORE UPDATE ON public.valoraciones
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- ÍNDICES de rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_propiedad_id
    ON public.leads (propiedad_id);

CREATE INDEX IF NOT EXISTS idx_valoraciones_propiedad_id
    ON public.valoraciones (propiedad_id);

CREATE INDEX IF NOT EXISTS idx_valoraciones_precio_estimado
    ON public.valoraciones (precio_estimado);
