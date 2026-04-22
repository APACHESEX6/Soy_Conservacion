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

## Flujo diario correcto

### 1) Actualizar rama base

Si el proyecto usa `develop`:

```bash
git checkout develop
git pull origin develop
```

Si el proyecto aun trabaja solo con `main`:

```bash
git checkout main
git pull origin main
```

### 2) Crear rama de trabajo

```bash
git checkout -b feature/mi-cambio
```

### 3) Trabajar y guardar cambios

```bash
git add .
git commit -m "feat: agrega modulo X"
```

### 4) Mantener la rama al dia

Si la base es `develop`:

```bash
git fetch origin
git rebase origin/develop
```

Si la base es `main`:

```bash
git fetch origin
git rebase origin/main
```

Si prefieres merge en vez de rebase:

```bash
git fetch origin
git merge origin/develop
```

o:

```bash
git fetch origin
git merge origin/main
```

### 5) Ejecutar calidad antes de subir

Desde `backend`:

```bash
pnpm run lint
pnpm run format:check
pnpm run typecheck
```

Desde `frontend`:

```bash
pnpm run lint
pnpm run format:check
```

### 6) Publicar rama

```bash
git push -u origin feature/mi-cambio
```

### 7) Abrir Pull Request

Destino sugerido:

- `feature/*` y `fix/*` hacia `develop` si existe.
- Si no existe `develop`, hacia `main`.
- `hotfix/*` hacia `main` y luego back-merge a la rama base.

## Flujo aplicado en este repo

Este fue el paso a paso real que usamos aqui:

1. Crear una rama de trabajo desde la rama base del repo.
2. Hacer los cambios en backend, frontend y documentacion.
3. Validar con `lint` y `typecheck`.
4. Hacer commit con un mensaje claro.
5. Subir la rama a GitHub.
6. Abrir un Pull Request desde `feature/diego-alejandro` hacia `main`.
7. Revisar que GitHub diga `Able to merge` antes de confirmar.

## Como resolver conflictos bien

1. Traer cambios recientes de la rama base.
2. Rebase o merge en tu rama.
3. Resolver archivo por archivo, probando cada bloque.
4. Ejecutar lint y format.
5. Hacer commit de resolucion.
6. Subir rama y continuar PR.

Comandos utiles:

```bash
git status
git diff
git add .
git rebase --continue
```

Si necesitas cancelar un rebase:

```bash
git rebase --abort
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
- [ ] Probado localmente.
- [ ] Titulo y descripcion clara del PR.

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