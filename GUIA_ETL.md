# Guia ETL - Soy Conservacion

Este documento define como ejecutar y operar el ETL automatico para:
- Excels en carpeta de Google Drive.
- Observaciones desde iNaturalist.

## 1) Objetivo

Unificar datos de dos fuentes heterogeneas y dejarlos consistentes para consultas geograficas y visualizacion en modal:
- Normaliza `grupo_taxonomico` (ES/EN, mayusculas/minusculas).
- Normaliza `username` y `nombre_cientifico` para evitar duplicados por formato.
- Hace `upsert` en catalogos (`usuario`, `grupo_taxonomico`, `especie`, `fuente`).
- Inserta/actualiza observaciones por claves unicas:
  - Drive: `observaciones.instance_id`
  - iNaturalist: `inaturalist_observaciones.inaturalist_id`
- Valida coordenadas geograficas en rango (`lat`: -90..90, `lng`: -180..180).
- Descarta filas con fecha invalida en lugar de inventar fecha actual.

## 2) Scripts disponibles

Ejecutar dentro de `backend`:

```bash
pnpm etl:run-once
```

Ese comando corre ambas fuentes (si estan habilitadas).

## 3) Scheduler automatico

El scheduler inicia junto al backend cuando la base de datos conecta correctamente.

Archivo: `backend/src/etl/etlScheduler.ts`

- Drive:
  - Default: cada 30 minutos (`*/30 * * * *`)
- iNaturalist:
  - Default: cada hora, minuto 15 (`15 * * * *`)

### Recomendacion de sondeo para iNaturalist

Para evitar sobrecarga y mantener frescura razonable:
- Recomendado: cada 60 minutos (default actual).
- Si necesitas menor latencia: cada 30 minutos.
- Evitar menos de 15 minutos salvo necesidad real.

## 4) Variables de entorno

Definidas en `backend/.env.example`.

### Basicas
- `ETL_RUN_ON_START=true`
- `ETL_TIMEZONE="America/Bogota"`

### Drive
- `DRIVE_ETL_ENABLED=true`
- `DRIVE_ETL_CRON="*/30 * * * *"`
- `GOOGLE_DRIVE_FOLDER_ID="..."`
- `GOOGLE_SERVICE_ACCOUNT_JSON="{...}"`

### iNaturalist
- `INAT_ETL_ENABLED=true`
- `INAT_ETL_CRON="15 * * * *"`
- `INAT_API_BASE_URL="https://api.inaturalist.org/v1"`
- `INAT_PER_PAGE=200`
- `INAT_MAX_PAGES=3`
- `INAT_LOOKBACK_MINUTES=120`
- `INAT_HTTP_RETRIES=3`
- `INAT_HTTP_TIMEOUT_MS=15000`

## 5) Mapeo de normalizacion taxonomica

El normalizador vive en `backend/src/etl/normalization.ts`.

Ejemplos de convergencia:
- `birds`, `aves` -> `Aves`
- `mammalia`, `mamiferos` -> `Mamiferos` (se presenta como `Mamíferos`)
- `fungi`, `hongos` -> `Hongos`
- `unknown` -> `Desconocido`

Si llega un valor no mapeado, se guarda en formato legible (Title Case) para no perder informacion.

## 6) Reglas de calidad de datos

El ETL omite filas cuando se cumple cualquiera de estos casos:
- No hay coordenadas completas (`latitud` y `longitud`).
- Coordenadas fuera de rango valido.
- Fecha de observacion vacia o invalida.

Razon:
- El visor geoespacial necesita puntos para mapa.
- Evita ruido de registros no georreferenciados en el frontend.

Si luego se requiere almacenar no georreferenciados, se puede habilitar una tabla staging o bandera de calidad.

## 7) Flujo de arranque recomendado

1. Configurar `backend/.env`.
2. Verificar Prisma:

```bash
pnpm prisma validate
```

3. Levantar backend:

```bash
pnpm dev
```

4. Revisar logs `ETL_SCHEDULE`, `ETL_START`, `ETL_SUMMARY`.

## 8) Logs clave

- `ETL_SCHEDULE`: cron registrado
- `ETL_START`: inicio de corrida
- `ETL_SUMMARY`: resumen por fuente
- `ETL_ROW_SKIP`: fila omitida por calidad de datos
- `ETL_ROW_FAIL`: fila fallida puntual
- `ETL_FAIL`: error global de una corrida
