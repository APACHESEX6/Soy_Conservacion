# Soy Conservacion - Guia de uso con pnpm

Este repositorio tiene dos servicios:

- `frontend` (Next.js)
- `backend` (Node/TypeScript)

## 1) Requisitos

- Node.js 20+
- `pnpm` instalado globalmente:

```bash
npm install -g pnpm
```

## 2) Instalacion de dependencias

Desde la raiz del proyecto, instala por separado:

```bash
cd frontend
pnpm install

cd ../backend
pnpm install
```

## 3) Levantar servidores en desarrollo

### Frontend (abre el navegador automaticamente)

```bash
cd frontend
pnpm dev
```

Al iniciar, se abre automaticamente `http://localhost:3000`.

### Backend (con terminal personalizada)

```bash
cd backend
pnpm dev
```

El backend usa recarga en caliente con `nodemon` y `ts-node`.

## 3.1) PostgreSQL, Prisma y pgAdmin

El backend ya queda preparado para usar Prisma ORM con PostgreSQL local.

1. Copia las variables del backend:

```bash
cd backend
copy .env.example .env
```

2. Abre pgAdmin instalado localmente y registra tu servidor PostgreSQL:

- Name: el que quieras, por ejemplo `PostgreSQL Local`
- Host name / address: `localhost`
- Port: `5432`
- Maintenance database: `postgres`
- Username: tu usuario real de PostgreSQL, por ejemplo `postgres`
- Password: la contraseña que configuraste al instalar PostgreSQL

3. Crea la base de datos `soy_conservacion`:

- En pgAdmin, abre `Servers` y entra al servidor que registraste.
- Haz clic derecho en `Databases`.
- Elige `Create` > `Database...`.
- En `Database`, escribe `soy_conservacion`.
- En `Owner`, selecciona tu usuario de PostgreSQL.
- Guarda los cambios.

4. Actualiza `backend/.env` con tu conexión local:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/soy_conservacion?schema=public"
```

5. Genera el cliente de Prisma:

```bash
cd backend
pnpm prisma:generate
```

6. Aplica el esquema inicial a la base de datos:

```bash
pnpm prisma:migrate -- --name init
```

7. Abre Prisma Studio si quieres explorar datos rapido:

```bash
pnpm prisma:studio
```

Si tu usuario o contraseña local de PostgreSQL son distintos, cambia el valor de `DATABASE_URL` para que coincida con tu instalación.

## 4) Scripts disponibles

### Frontend

- `pnpm dev`: inicia frontend con banner profesional y auto-open del navegador.
- `pnpm dev:next`: inicia `next dev` directo (sin envoltura personalizada).
- `pnpm build`: compila para produccion.
- `pnpm start`: corre la build de produccion.
- `pnpm lint`: ejecuta ESLint.

### Backend

- `pnpm dev`: inicia backend con banner profesional.
- `pnpm dev:server`: ejecuta `nodemon` + `ts-node` sobre `src/server.ts`.
- `pnpm build`: compila TypeScript a `dist`.
- `pnpm start`: levanta servidor compilado en `dist/server.js`.
- `pnpm prisma:generate`: genera el Prisma Client.
- `pnpm prisma:migrate`: crea y aplica migraciones.
- `pnpm prisma:db-push`: sincroniza el esquema sin migracion.
- `pnpm prisma:studio`: abre Prisma Studio.
- `pnpm typecheck`: valida tipos sin generar archivos.
- `pnpm test`: placeholder para pruebas.

## 5) Comandos utiles de pnpm

- `pnpm add <paquete>`: agrega dependencia.
- `pnpm add -D <paquete>`: agrega dependencia de desarrollo.
- `pnpm remove <paquete>`: elimina dependencia.
- `pnpm update`: actualiza dependencias segun rangos permitidos.
- `pnpm outdated`: muestra paquetes desactualizados.
- `pnpm store prune`: limpia cache vieja del store.
- `pnpm -r run <script>`: ejecuta un script en multiples paquetes (modo recursivo).

## 6) Notas de estilo en terminal

Se agregaron lanzadores personalizados para ambos servicios:

- `frontend/scripts/dev-frontend.mjs`
- `backend/scripts/dev-backend.mjs`

Estos scripts mejoran legibilidad visual, muestran informacion util y mantienen flujo profesional de arranque.

## 7) Flujo de ramas para trabajo en equipo

Para una guia clara de colaboracion (ramas, PRs, conflictos y comandos), revisa:

- `GUIA_GIT.md`

## 7.1) ETL automatico (Drive + iNaturalist)

Para configuracion, cron, variables y normalizacion de datos:

- `GUIA_ETL.md`

## 7.2) Optimizacion API GeoJSON (mapa)

El endpoint `/api/observaciones/geojson` incluye cache en memoria + `ETag` para acelerar el mapa.

Variables opcionales (backend):

- `OBS_GEOJSON_CACHE_ENABLED=true`
- `OBS_GEOJSON_CACHE_TTL_MS=30000` (rango 5000-300000)
- `OBS_GEOJSON_CACHE_MAX=200` (rango 20-1000)
- `OBS_GEOJSON_USE_POSTGIS=true` (usa indices GiST cuando hay bbox)

## 8) Mini secuencia para subir cambios

Usa esta rutina corta cuando ya estas trabajando en tu rama:

```bash
git status
git add .
git commit -m "fix: describe el cambio"
git fetch origin
git rebase origin/develop
git push
```

Si aun no creaste rama para tu tarea:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/mi-cambio
```
