-- Tabla para configuración global de la app
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar valor inicial para el Test A/B (opciones: 'random', 'A', 'B')
INSERT INTO public.app_config (key, value)
VALUES ('ab_test_mode', 'random')
ON CONFLICT (key) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Política para que cualquiera pueda LEER (necesario para el middleware)
CREATE POLICY "Allow public read access" ON public.app_config
    FOR SELECT USING (true);

-- Política para que solo administradores puedan EDITAR (usaremos el rol authenticated por ahora)
CREATE POLICY "Allow authenticated update" ON public.app_config
    FOR UPDATE TO authenticated USING (true);
