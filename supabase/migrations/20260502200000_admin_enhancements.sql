-- ─── leads: add pdf_downloaded + lang ───────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS pdf_downloaded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS lang           TEXT;

-- ─── propiedades: geo coords for admin map ───────────────────────────────────
ALTER TABLE public.propiedades
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- ─── Admin SELECT/UPDATE policies for leads ───────────────────────────────────
DROP POLICY IF EXISTS "leads: auth puede leer"     ON public.leads;
DROP POLICY IF EXISTS "leads: auth puede actualizar" ON public.leads;

CREATE POLICY "leads: auth puede leer"
  ON public.leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "leads: auth puede actualizar"
  ON public.leads FOR UPDATE TO authenticated USING (true);

GRANT SELECT, UPDATE ON public.leads TO authenticated;

-- ─── set_pdf_downloaded: SECURITY DEFINER so anon can mark PDF as downloaded ─
CREATE OR REPLACE FUNCTION public.set_pdf_downloaded(p_propiedad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads
    SET pdf_downloaded = TRUE
  WHERE propiedad_id = p_propiedad_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_pdf_downloaded(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.set_pdf_downloaded(UUID) TO authenticated;
