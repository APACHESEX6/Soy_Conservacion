-- Migración: agregar columna license a observaciones iNaturalist
ALTER TABLE "inaturalist_observaciones"
ADD COLUMN "license" TEXT;

-- Opcional: indexar licencias si se realizan consultas frecuentes.
CREATE INDEX IF NOT EXISTS "inaturalist_observaciones_license_idx"
    ON "inaturalist_observaciones" ("license");
