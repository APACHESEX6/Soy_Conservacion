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

- `GUIA_RAMAS_GIT.md`
