# Guia de ramas y colaboracion en Git

## Objetivo

Tener un flujo simple, ordenado y seguro para evitar conflictos y mantener el proyecto estable.

## Flujo recomendado

Usar GitHub Flow con ramas de trabajo cortas:

- `main`: produccion estable.
- `develop`: integracion del sprint, si el equipo decide usarla.
- `feature/<nombre-corto>`: nuevas funcionalidades.
- `fix/<nombre-corto>`: correcciones de bugs.
- `hotfix/<nombre-corto>`: arreglos urgentes para produccion.

Ejemplos:

- `feature/login-google`
- `fix/error-db-timeout`
- `hotfix/token-expirado`

## Reglas del equipo

1. Nunca desarrollar directo en `main`.
2. Cada tarea vive en su propia rama.
3. Todo cambio entra por Pull Request.
4. La rama base debe estar actualizada antes de abrir el PR.
5. El PR debe ser pequeno y enfocado.
6. Resolver conflictos en la rama de trabajo, no en `main`.
7. Validar lint, format y typecheck antes de subir.

## Ruta unica paso a paso (de inicio a fin)

Esta es la secuencia principal para trabajar sin perderte.
Si sigues estos pasos en orden, evitas casi todos los problemas.

### 1) Actualizar la rama base del proyecto

Si el equipo usa `develop`:

```bash
git checkout develop
git pull origin develop
```

Si el equipo usa `main`:

```bash
git checkout main
git pull origin main
```

### 2) Crear tu rama de trabajo

```bash
git checkout -b feature/mi-cambio
```

Si la rama ya existe:

```bash
git checkout feature/mi-cambio
```

### 3) Trabajar y guardar cambios

```bash
git add .
git commit -m "feat: agrega modulo X"
```

### 4) Actualizar tu rama antes de subir

Si el equipo usa `develop`:

```bash
git fetch origin
git rebase origin/develop
```

Si el equipo usa `main`:

```bash
git fetch origin
git rebase origin/main
```

### 5) Subir tu rama a GitHub

```bash
git push -u origin feature/mi-cambio
```

### 6) Abrir Pull Request

Destino sugerido:

- `feature/*` y `fix/*` hacia `develop` si existe.
- Si no existe `develop`, hacia `main`.
- `hotfix/*` hacia `main` y luego back-merge a la rama base.

### 7) Verificacion final

```bash
git status -sb
```

Debes ver la rama limpia y sincronizada con remoto.

## Cuando algo falla (solucion rapida)

### A) Conflicto en rebase

```bash
git status --short
```

1. Resolver los archivos en conflicto.
2. Guardar y marcar como resueltos:

```bash
git add .
git rebase --continue
```

Si necesitas cancelar:

```bash
git rebase --abort
```

### B) Push bloqueado por pre-push (quality gate)

Frontend:

```bash
cd frontend
pnpm run quality
```

Backend:

```bash
cd ../backend
pnpm run quality
```

Luego vuelve a la raiz y sube:

```bash
cd ..
git add .
git commit -m "chore: ajusta formato para pasar quality gate"
git push origin feature/mi-cambio
```

### C) GitHub muestra "X detras"

```bash
git checkout feature/mi-cambio
git fetch origin
git rebase origin/main
git push origin feature/mi-cambio
```

## Convencion de commits recomendada

Formato:

- `feat: ...` nueva funcionalidad
- `fix: ...` correccion
- `refactor: ...` mejora interna sin cambiar comportamiento
- `docs: ...` documentacion
- `chore: ...` tareas de mantenimiento

Ejemplos:

- `feat: agrega validacion de formulario de registro`
- `fix: corrige apertura doble de browser en script dev`

## Checklist rapido antes de crear PR

- [ ] Mi rama parte de la base correcta.
- [ ] Los cambios estan acotados a una sola tarea.
- [ ] `pnpm run lint` en verde.
- [ ] `pnpm run format:check` en verde.
- [ ] `pnpm run typecheck` en verde si aplica.
- [ ] `pnpm run build` en verde si aplica.
- [ ] `pnpm prisma validate` y `pnpm prisma:generate` en verde si se tocó backend/Prisma.
- [ ] Probado localmente.
- [ ] Titulo y descripcion clara del PR.
## Hook pre-push (recomendado)

Para evitar subir cambios con errores, este repo incluye un hook local que ejecuta quality gate antes de cada push.

### Activacion en Windows PowerShell

```powershell
cd c:\Users\Aleja\Soy_Conservación\Soy_Conservacion
powershell -ExecutionPolicy Bypass -File .\scripts\setup-githooks.ps1
```

### Que valida el hook

1. Frontend: `format:check`, lint, typecheck y build.
2. Backend: `format:check`, lint estricto, `prisma validate`, `prisma:generate`, typecheck y build.

Si algun paso falla, el push se bloquea.

### Desactivar temporalmente (solo emergencia)

```bash
git push --no-verify
```

Usar `--no-verify` solo de forma excepcional y con criterio del equipo.

## Recomendaciones extra para evitar conflictos

1. Hacer pull/rebase frecuente.
2. Evitar ramas largas de muchos dias.
3. Dividir trabajo grande en PR pequenos.
4. Acordar ownership por modulo (frontend/backend/rutas).
5. No mezclar refactor grande con feature en el mismo PR.

## Publicar este proyecto en GitHub (desde cero)

Si la carpeta aun no tiene `.git` inicializado:

```bash
cd c:\Users\Aleja\soy_conservacion
git init
git branch -M main
git remote add origin https://github.com/APACHESEX6/Soy_Conservacion.git
git add .
git commit -m "chore: inicializa proyecto"
git push -u origin main
```

Si el remoto ya tiene historial, primero trae cambios y luego integra:

```bash
git fetch origin
git checkout -b main origin/main
```

Despues mueve tus cambios de forma ordenada por ramas y PRs.
