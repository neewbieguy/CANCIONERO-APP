-- Preferencias de lectura de canciones por usuario
ALTER TABLE "User" ADD COLUMN "songPrefs" JSONB;

-- Notas de cada canción
ALTER TABLE "Song" ADD COLUMN "notes" TEXT;
