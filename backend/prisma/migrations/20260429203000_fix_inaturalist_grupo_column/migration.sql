-- Corrige el esquema fisico de inaturalist_observaciones para que coincida con Prisma.
-- La tabla existente en la BD conserva una columna legada `grupo_taxonomico` y no tenia `id_grupo`.

ALTER TABLE "inaturalist_observaciones"
ADD COLUMN IF NOT EXISTS "id_grupo" INTEGER;

UPDATE "inaturalist_observaciones" io
SET "id_grupo" = gt."id_grupo"
FROM "grupo_taxonomico" gt
WHERE io."id_grupo" IS NULL
  AND io."grupo_taxonomico" IS NOT NULL
  AND gt."nombre" = io."grupo_taxonomico";

CREATE INDEX IF NOT EXISTS "inaturalist_observaciones_id_grupo_idx"
ON "inaturalist_observaciones"("id_grupo");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'inaturalist_observaciones_id_grupo_fkey'
  ) THEN
    ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_id_grupo_fkey"
    FOREIGN KEY ("id_grupo") REFERENCES "grupo_taxonomico"("id_grupo")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "inaturalist_observaciones"
    WHERE "id_grupo" IS NULL
  ) THEN
    ALTER TABLE "inaturalist_observaciones"
    ALTER COLUMN "id_grupo" SET NOT NULL;
  END IF;
END
$$;
