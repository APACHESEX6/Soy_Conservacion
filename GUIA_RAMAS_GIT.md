# Guia de ramas y colaboracion en Git (equipo)

## Objeti

Tener un flujo simple, ordenado y seguro para evitar conflictos y mantener el proyecto estable.

## Estrategia recomendada

Usar un flujo tipo GitHub Flow con soporte de rama de integracion:

- `main`: produccion estable.
- `develop`: integracion del sprint.
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
4. Antes de abrir PR, sincronizar con `develop`.
5. PR pequeno y enfocado (un objetivo por PR).
6. Al menos 1 aprobacion antes de merge.
7. Resolver conflictos en la rama de trabajo, no en `main`.

## Flujo diario correcto

### 1) Actualizar rama base

```bash
git checkout develop
git pull origin develop
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

### 4) Mantener la rama al dia (evita conflictos grandes)

```bash
git fetch origin
git rebase origin/develop
```

Si prefieren merge en vez de rebase:

```bash
git fetch origin
git merge origin/develop
```

### 5) Ejecutar calidad antes de subir

Desde `backend`:

```bash
pnpm run lint
pnpm run format:check
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

- `feature/*` y `fix/*` hacia `develop`
- `hotfix/*` hacia `main` y luego back-merge a `develop`

## Como resolver conflictos bien

1. Traer cambios recientes de `develop`.
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

- [ ] Mi rama parte de `develop` actualizado
- [ ] Cambios acotados a una sola tarea
- [ ] `pnpm run lint` en verde
- [ ] `pnpm run format:check` en verde
- [ ] Probado localmente
- [ ] Titulo y descripcion clara del PR

## Recomendaciones extra para evitar conflictos

1. Hacer pull/rebase frecuente (1 a 2 veces por dia).
2. Evitar ramas largas de muchos dias.
3. Dividir trabajo grande en PR pequenos.
4. Acordar ownership por modulo (frontend/backend/rutas).
5. No mezclar refactor grande con feature en el mismo PR.

## Publicar este proyecto en GitHub (desde cero)

Tu carpeta actual no tiene `.git` inicializado aun. Si quieres conectarla al repo:

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
