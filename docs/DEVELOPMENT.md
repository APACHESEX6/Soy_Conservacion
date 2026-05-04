# 📋 Guía de Desarrollo — Soy Conservación

## Setup inicial (primera vez)

```bash
# 1. Clonar repo e instalar dependencias
git clone <repo-url>
cd Soy_Conservacion
pnpm install

# 2. Configurar entorno
# Copiar .env.example a .env en backend y frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Iniciar hooks de Husky
pnpm prepare

# 4. Verificar que todo funciona
pnpm validate
```

## Flujo de desarrollo diario

### Desarrollo local
```bash
# Iniciar ambos servicios (frontend + backend)
pnpm dev

# O iniciar por separado
pnpm dev:frontend    # http://localhost:3000
pnpm dev:backend     # http://localhost:3001
```

### Antes de hacer commit
```bash
# Verificar formatos y linting automáticamente (via pre-commit hook)
git add .
git commit -m "feat: tu cambio"
# El hook pre-commit ejecutará automáticamente lint-staged

# Si necesitas corregir manualmente:
pnpm lint:fix      # Arreglar issues automáticamente
pnpm format         # Formatear código
```

### Antes de hacer push
```bash
# El hook pre-push ejecutará automáticamente:
# - format:check (Prettier)
# - lint:ci (ESLint/Biome con cero warnings)
# - typecheck (TypeScript)

git push

# Si el push falla, ejecuta esto localmente:
pnpm quality
```

## Verificar calidad en cualquier momento

```bash
# Verificar TODO el proyecto (frontend + backend)
pnpm quality

# Verificar solo frontend
pnpm quality:frontend

# Verificar solo backend
pnpm quality:backend

# Chequeos individuales
pnpm format:check  # ¿Está bien formateado?
pnpm lint:ci       # ¿Hay errores/warnings de lint?
pnpm typecheck     # ¿Hay errores de TypeScript?
```

## Estructura de herramientas

### Todo el Proyecto (Monorepo)
- **Motor de Calidad**: [Biome](https://biomejs.dev/) (Formateo + Linting unificado)
- **Gestor de Paquetes**: pnpm v10
- **Orquestación**: TurboRepo
- **TypeScript**: Configuración estricta en ambos servicios

### Hooks Git
- **pre-commit**: `lint-staged` → Biome check --apply (formateo + lint automático)
- **pre-push**: `pnpm validate` → Ejecuta format:check, lint:ci, typecheck y build en paralelo via Turbo

### CI/CD
- **GitHub Actions**: `.github/workflows/quality-gate.yml`
  - Ejecuta `pnpm validate` completo en un entorno de PostGIS real.

## Reglas importantes

✅ **DEBES**
- Ejecutar `pnpm setup-hooks` una sola vez al empezar
- Hacer push solo cuando `pnpm quality` pase
- Mantener los checks de CI en verde
- Usar `--fix` flags si lint falla automáticamente

❌ **NO DEBES**
- Hacer push sin verificar calidad localmente
- Ignorar warnings de lint (se bloquean en CI)
- Hacer `git push --force` en `main` o `develop`
- Hacer merge de PRs si el workflow falla en GitHub

## Troubleshooting

### "pre-commit hook failed"
```bash
# Verifica que los hooks estén instalados
git config --get core.hooksPath
# Debe mostrar: .githooks

# Si no, reinicia los hooks
pnpm setup-hooks
```

### "lint:ci failed: X warnings found"
```bash
# Arregla automáticamente
pnpm lint:fix

# Luego formatea
pnpm format

# Luego verifica
pnpm quality
```

### "TypeScript errors"
```bash
# Revisa los errores
pnpm typecheck

# Revisa tus types — no hay auto-fix
```

## Comandos rápidos

```bash
# Limpiar builds y caches
pnpm clean

# Validar todo en segundos
pnpm validate

# Ver estado actual de changes
git status
```

## Más info

- [GUIA_GIT.md](../GUIA_GIT.md) — workflow de branches y PRs
- [GUIA_PRISMA.md](../GUIA_PRISMA.md) — cambios de base de datos
- [README.md](../README.md) — visión general del proyecto

---

**Última actualización**: 3 de mayo de 2026
**Status**: ✅ Premium — 2026 best practices
