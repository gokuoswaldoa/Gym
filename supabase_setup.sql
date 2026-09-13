-- Copia y pega esto en el SQL Editor de tu Dashboard de Supabase

CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- Para el futuro, si añades Auth
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (opcional, pero recomendado)
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Por ahora, como no hay Auth, permitimos acceso anónimo (CUIDADO: solo para pruebas)
CREATE POLICY "Permitir todo a anónimos" ON backups FOR ALL USING (true);
