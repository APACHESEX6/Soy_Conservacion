-- =============================================================================
-- Migración inicial: Soy Conservación
-- Incluye: PostGIS, esquema relacional completo, columnas geom con SRID 4326,
--          triggers de sincronización automática, índices GIST espaciales,
--          índices de búsqueda frecuente y secuencias ordenadas desde 1.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensiones
-- ---------------------------------------------------------------------------

-- PostGIS: habilita tipos geométricos y funciones espaciales (ST_MakePoint,
-- ST_Intersects, ST_SetSRID, etc.). IF NOT EXISTS evita error si ya existe.
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------------------
-- 2. Tablas de catálogo (sin dependencias externas)
-- ---------------------------------------------------------------------------

CREATE TABLE "usuarios" (
    "id_usuario"     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "username"       TEXT    NOT NULL,
    "fecha_registro" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "grupo_taxonomico" (
    "id_grupo" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "nombre"   TEXT NOT NULL
);

CREATE TABLE "fuente" (
    "id_fuente" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "nombre"    TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3. Tabla de especies (depende de grupo_taxonomico)
-- ---------------------------------------------------------------------------

CREATE TABLE "especies" (
    "id_especie"       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "nombre_cientifico" TEXT    NOT NULL,
    "grupo_taxonomico"  INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- 4. Tablas de observaciones con columna geom PostGIS desde el inicio
--    SRID 4326 = WGS 84 (sistema de coordenadas geográficas estándar global,
--    el mismo que usan GPS, GeoJSON y Mapbox GL JS).
-- ---------------------------------------------------------------------------

CREATE TABLE "observaciones" (
    "id_observacion" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "id_usuario"     INTEGER  NOT NULL,
    "id_especie"     INTEGER  NOT NULL,
    "instance_id"    TEXT     NOT NULL,
    "fecha"          TIMESTAMPTZ NOT NULL,
    "foto"           TEXT,
    "audio"          TEXT,
    "latitud"        DOUBLE PRECISION,
    "longitud"       DOUBLE PRECISION,
    -- Punto geográfico WGS 84 (EPSG:4326). Se mantiene sincronizado
    -- automáticamente con latitud/longitud mediante el trigger definido abajo.
    "geom"           geometry(Point, 4326),
    "altitude"       DOUBLE PRECISION,
    "accuracy"       DOUBLE PRECISION,
    "id_fuente"      INTEGER  NOT NULL
);

CREATE TABLE "inaturalist_observaciones" (
    "id_inaturalist_observacion" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "id_usuario"                 INTEGER  NOT NULL,
    "id_especie"                 INTEGER  NOT NULL,
    "inaturalist_id"             TEXT     NOT NULL,
    "fecha"                      TIMESTAMPTZ NOT NULL,
    "foto"                       TEXT,
    "audio"                      TEXT,
    "latitud"                    DOUBLE PRECISION,
    "longitud"                   DOUBLE PRECISION,
    -- Punto geográfico WGS 84 (EPSG:4326). Se mantiene sincronizado
    -- automáticamente con latitud/longitud mediante el trigger definido abajo.
    "geom"                       geometry(Point, 4326),
    "accuracy"                   DOUBLE PRECISION,
    "url_inaturalist"            TEXT,
    "quality_grade"              TEXT,
    "id_grupo"                   INTEGER  NOT NULL,
    "id_fuente"                  INTEGER  NOT NULL
);

-- ---------------------------------------------------------------------------
-- 5. Constraints de unicidad
-- ---------------------------------------------------------------------------

ALTER TABLE "usuarios"
    ADD CONSTRAINT "usuarios_username_key" UNIQUE ("username");

ALTER TABLE "grupo_taxonomico"
    ADD CONSTRAINT "grupo_taxonomico_nombre_key" UNIQUE ("nombre");

ALTER TABLE "especies"
    ADD CONSTRAINT "especies_nombre_cientifico_key" UNIQUE ("nombre_cientifico");

ALTER TABLE "fuente"
    ADD CONSTRAINT "fuente_nombre_key" UNIQUE ("nombre");

ALTER TABLE "observaciones"
    ADD CONSTRAINT "observaciones_instance_id_key" UNIQUE ("instance_id");

ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_inaturalist_id_key" UNIQUE ("inaturalist_id");

-- ---------------------------------------------------------------------------
-- 6. Claves foráneas con integridad referencial
-- ---------------------------------------------------------------------------

ALTER TABLE "especies"
    ADD CONSTRAINT "especies_grupo_taxonomico_fkey"
    FOREIGN KEY ("grupo_taxonomico")
    REFERENCES "grupo_taxonomico" ("id_grupo")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "observaciones"
    ADD CONSTRAINT "observaciones_id_usuario_fkey"
    FOREIGN KEY ("id_usuario")
    REFERENCES "usuarios" ("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "observaciones"
    ADD CONSTRAINT "observaciones_id_especie_fkey"
    FOREIGN KEY ("id_especie")
    REFERENCES "especies" ("id_especie")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "observaciones"
    ADD CONSTRAINT "observaciones_id_fuente_fkey"
    FOREIGN KEY ("id_fuente")
    REFERENCES "fuente" ("id_fuente")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_id_usuario_fkey"
    FOREIGN KEY ("id_usuario")
    REFERENCES "usuarios" ("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_id_especie_fkey"
    FOREIGN KEY ("id_especie")
    REFERENCES "especies" ("id_especie")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_id_grupo_fkey"
    FOREIGN KEY ("id_grupo")
    REFERENCES "grupo_taxonomico" ("id_grupo")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inaturalist_observaciones"
    ADD CONSTRAINT "inaturalist_observaciones_id_fuente_fkey"
    FOREIGN KEY ("id_fuente")
    REFERENCES "fuente" ("id_fuente")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 7. Índices de búsqueda frecuente (B-Tree)
-- ---------------------------------------------------------------------------

-- Catálogo
CREATE INDEX "especies_grupo_taxonomico_idx"
    ON "especies" ("grupo_taxonomico");

-- Observaciones Drive
CREATE INDEX "observaciones_id_usuario_idx"
    ON "observaciones" ("id_usuario");

CREATE INDEX "observaciones_id_especie_idx"
    ON "observaciones" ("id_especie");

CREATE INDEX "observaciones_id_fuente_idx"
    ON "observaciones" ("id_fuente");

CREATE INDEX "observaciones_fecha_idx"
    ON "observaciones" ("fecha");

CREATE INDEX "observaciones_lat_lng_idx"
    ON "observaciones" ("latitud", "longitud")
    WHERE "latitud" IS NOT NULL AND "longitud" IS NOT NULL;

CREATE INDEX "observaciones_fecha_lat_lng_idx"
    ON "observaciones" ("fecha", "latitud", "longitud")
    WHERE "latitud" IS NOT NULL AND "longitud" IS NOT NULL;

-- Observaciones iNaturalist
CREATE INDEX "inaturalist_observaciones_id_usuario_idx"
    ON "inaturalist_observaciones" ("id_usuario");

CREATE INDEX "inaturalist_observaciones_id_especie_idx"
    ON "inaturalist_observaciones" ("id_especie");

CREATE INDEX "inaturalist_observaciones_id_grupo_idx"
    ON "inaturalist_observaciones" ("id_grupo");

CREATE INDEX "inaturalist_observaciones_id_fuente_idx"
    ON "inaturalist_observaciones" ("id_fuente");

CREATE INDEX "inaturalist_observaciones_fecha_idx"
    ON "inaturalist_observaciones" ("fecha");

CREATE INDEX "inaturalist_observaciones_lat_lng_idx"
    ON "inaturalist_observaciones" ("latitud", "longitud")
    WHERE "latitud" IS NOT NULL AND "longitud" IS NOT NULL;

CREATE INDEX "inaturalist_observaciones_fecha_lat_lng_idx"
    ON "inaturalist_observaciones" ("fecha", "latitud", "longitud")
    WHERE "latitud" IS NOT NULL AND "longitud" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 8. Índices espaciales GIST (PostGIS)
--    GIST es el tipo de índice nativo de PostGIS para geometrías.
--    La condición parcial WHERE geom IS NOT NULL evita indexar NULLs.
-- ---------------------------------------------------------------------------

CREATE INDEX "observaciones_geom_gist_idx"
    ON "observaciones" USING GIST ("geom")
    WHERE "geom" IS NOT NULL;

CREATE INDEX "inaturalist_observaciones_geom_gist_idx"
    ON "inaturalist_observaciones" USING GIST ("geom")
    WHERE "geom" IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 9. Funciones y triggers de sincronización automática de geom
--    Cada vez que se inserta o actualiza latitud/longitud, el trigger
--    recalcula geom automáticamente usando ST_MakePoint(longitud, latitud)
--    con SRID 4326. Nota: GeoJSON y PostGIS usan orden (X=lng, Y=lat).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_observaciones_geom()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."latitud" IS NULL OR NEW."longitud" IS NULL THEN
        NEW."geom" := NULL;
    ELSE
        -- ST_MakePoint(X, Y) → X = longitud, Y = latitud (orden GeoJSON/PostGIS)
        NEW."geom" := ST_SetSRID(
            ST_MakePoint(NEW."longitud", NEW."latitud"),
            4326
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_inaturalist_observaciones_geom()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."latitud" IS NULL OR NEW."longitud" IS NULL THEN
        NEW."geom" := NULL;
    ELSE
        NEW."geom" := ST_SetSRID(
            ST_MakePoint(NEW."longitud", NEW."latitud"),
            4326
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger para observaciones (Drive / ODK)
DROP TRIGGER IF EXISTS observaciones_geom_sync ON "observaciones";
CREATE TRIGGER observaciones_geom_sync
    BEFORE INSERT OR UPDATE OF "latitud", "longitud"
    ON "observaciones"
    FOR EACH ROW
    EXECUTE FUNCTION sync_observaciones_geom();

-- Trigger para observaciones iNaturalist
DROP TRIGGER IF EXISTS inaturalist_observaciones_geom_sync ON "inaturalist_observaciones";
CREATE TRIGGER inaturalist_observaciones_geom_sync
    BEFORE INSERT OR UPDATE OF "latitud", "longitud"
    ON "inaturalist_observaciones"
    FOR EACH ROW
    EXECUTE FUNCTION sync_inaturalist_observaciones_geom();
