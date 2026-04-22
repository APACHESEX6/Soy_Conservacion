-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "grupo_taxonomico" (
    "id_grupo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "grupo_taxonomico_pkey" PRIMARY KEY ("id_grupo")
);

-- CreateTable
CREATE TABLE "especies" (
    "id_especie" SERIAL NOT NULL,
    "nombre_cientifico" TEXT NOT NULL,
    "grupo_taxonomico" INTEGER NOT NULL,

    CONSTRAINT "especies_pkey" PRIMARY KEY ("id_especie")
);

-- CreateTable
CREATE TABLE "fuente" (
    "id_fuente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "fuente_pkey" PRIMARY KEY ("id_fuente")
);

-- CreateTable
CREATE TABLE "observaciones" (
    "id_observacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_especie" INTEGER NOT NULL,
    "instance_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "foto" TEXT,
    "audio" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "id_fuente" INTEGER NOT NULL,

    CONSTRAINT "observaciones_pkey" PRIMARY KEY ("id_observacion")
);

-- CreateTable
CREATE TABLE "inaturalist_observaciones" (
    "id_inaturalist_observacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_especie" INTEGER NOT NULL,
    "inaturalist_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "foto" TEXT,
    "audio" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "url_inaturalist" TEXT,
    "quality_grade" TEXT,
    "grupo_taxonomico" TEXT,
    "id_fuente" INTEGER NOT NULL,

    CONSTRAINT "inaturalist_observaciones_pkey" PRIMARY KEY ("id_inaturalist_observacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_username_key" ON "usuarios"("username");

-- CreateIndex
CREATE UNIQUE INDEX "especies_nombre_cientifico_key" ON "especies"("nombre_cientifico");

-- CreateIndex
CREATE UNIQUE INDEX "observaciones_instance_id_key" ON "observaciones"("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "inaturalist_observaciones_inaturalist_id_key" ON "inaturalist_observaciones"("inaturalist_id");

-- AddForeignKey
ALTER TABLE "especies" ADD CONSTRAINT "especies_grupo_taxonomico_fkey" FOREIGN KEY ("grupo_taxonomico") REFERENCES "grupo_taxonomico"("id_grupo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "observaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "observaciones_id_especie_fkey" FOREIGN KEY ("id_especie") REFERENCES "especies"("id_especie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observaciones" ADD CONSTRAINT "observaciones_id_fuente_fkey" FOREIGN KEY ("id_fuente") REFERENCES "fuente"("id_fuente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inaturalist_observaciones" ADD CONSTRAINT "inaturalist_observaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inaturalist_observaciones" ADD CONSTRAINT "inaturalist_observaciones_id_especie_fkey" FOREIGN KEY ("id_especie") REFERENCES "especies"("id_especie") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inaturalist_observaciones" ADD CONSTRAINT "inaturalist_observaciones_id_fuente_fkey" FOREIGN KEY ("id_fuente") REFERENCES "fuente"("id_fuente") ON DELETE RESTRICT ON UPDATE CASCADE;
