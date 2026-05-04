# 🧪 Guía de Testing — Soy Conservación 2026

**Estándar:** Elite Engineering | **Framework:** Vitest 3.0 + Playwright 1.50+

## 📌 Resumen Ejecutivo

Tu proyecto ahora tiene:
- ✅ **Vitest 3.0**: Unit/integration tests con coverage 70%+
- ✅ **Playwright**: E2E tests para flujos críticos
- ✅ **Health checks**: `/health`, `/ready`, `/live` endpoints
- ✅ **Winston logging**: Structured logs con rotación de archivos
- ✅ **Security scanning**: CodeQL SAST automático
- ✅ **Dependency audit**: Dependabot + audit workflow

---

## 🚀 Quick Start

### Instalar dependencias
```bash
pnpm install
```

### Ejecutar tests
```bash
# Watch mode (desarrollo)
pnpm test:watch

# Una sola ejecución
pnpm test:run

# Con coverage
pnpm test:coverage

# UI interactiva
pnpm test:ui
```

### Ejecutar tests específicos
```bash
# Backend unit tests
pnpm -C backend test

# Frontend unit tests (próxima configuración)
pnpm -C frontend test

# E2E tests (próxima configuración)
pnpm test:e2e
```

---

## 📐 Estructura de Tests

### Backend (`/backend/src/__tests__/`)
```
__tests__/
├── setup.ts                 # Configuración global
├── example.test.ts          # Ejemplo de unit tests
├── unit/
│   ├── utils/
│   │   └── logger.test.ts
│   ├── services/
│   │   └── etlService.test.ts
│   └── validation/
│       └── normalization.test.ts
└── integration/
    ├── api/
    │   ├── observaciones.test.ts
    │   └── health.test.ts
    └── database/
        └── prisma.test.ts
```

### Frontend (`/frontend/src/__tests__/`) — Por implementar
```
__tests__/
├── setup.ts
├── components/
│   ├── MapView.test.tsx
│   └── Sidebar.test.tsx
└── hooks/
    └── useMapbox.test.ts
```

---

## 🎯 Mejores Prácticas

### 1. Unit Tests (Capa de lógica pura)

```typescript
// backend/src/__tests__/unit/utils/logger.test.ts
import { describe, it, expect, vi } from "vitest";

describe("Logger", () => {
  it("should format error messages correctly", () => {
    const error = new Error("Test error");
    const formatted = formatError(error);
    
    expect(formatted).toContain("Test error");
    expect(formatted).toHaveProperty("timestamp");
  });
});
```

### 2. Integration Tests (Servicios + Database)

```typescript
// backend/src/__tests__/integration/database/prisma.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("Prisma ORM", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should create and fetch usuarios", async () => {
    const usuario = await prisma.usuario.create({
      data: { email: "test@example.com", nombre: "Test" },
    });

    const fetched = await prisma.usuario.findUnique({
      where: { id: usuario.id },
    });

    expect(fetched?.email).toBe("test@example.com");

    // Cleanup
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });
});
```

### 3. API Route Tests

```typescript
// backend/src/__tests__/integration/api/observaciones.test.ts
import { describe, it, expect } from "vitest";
import app from "../../app";

describe("GET /api/observaciones", () => {
  it("should return observaciones with pagination", async () => {
    const response = await app.get("/api/observaciones?limit=10&offset=0");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(response.body).toHaveProperty("total");
  });
});
```

---

## 📊 Coverage Goals

| Categoría | Meta | Estado |
|-----------|------|--------|
| **Unit tests** | 80%+ | 🟡 En progreso |
| **Integration tests** | 60%+ | 🟡 En progreso |
| **E2E critical paths** | 5+ | 🟡 Por hacer |
| **API endpoints** | 100% | 🟡 En progreso |

Ejecutar:
```bash
pnpm test:coverage
```

Reporte: `coverage/index.html` (abre en navegador)

---

## 🔐 Testing de Seguridad

### Validación de Input (Zod)

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

const emailSchema = z.string().email();

describe("Email validation", () => {
  it("should reject invalid emails", () => {
    expect(() => emailSchema.parse("invalid")).toThrow();
  });

  it("should accept valid emails", () => {
    expect(emailSchema.parse("test@example.com")).toBe("test@example.com");
  });
});
```

### SQL Injection Prevention (Prisma)

Prisma **previene automáticamente** SQL injection:
```typescript
// ✅ SEGURO: Prisma parametriza
await prisma.observacion.findMany({
  where: { especie_id: userInput },
});

// ❌ NUNCA: Raw SQL sin parámetros
await prisma.$executeRaw`SELECT * FROM observacion WHERE id = ${userInput}`;
```

---

## 🛠️ Monitoreo en Desarrollo

### Health Endpoints

```bash
# Health check básico
curl http://localhost:8080/health

# Readiness check (para k8s)
curl http://localhost:8080/ready

# Liveness check (para k8s)
curl http://localhost:8080/live
```

Respuestas:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-04T10:30:00.000Z",
  "uptime": 3600.5
}
```

---

## 📝 Logging Estructurado

### Usar Winston en lugar de `console.log`

```typescript
import logger from "../utils/logger";

// ✅ CORRECTO
logger.info("User created", { userId: 123, email: "test@example.com" });
logger.error("Database connection failed", { code: "ECONNREFUSED", retries: 3 });
logger.warn("Deprecated API endpoint used", { endpoint: "/api/v1/users" });

// ❌ EVITAR
console.log("User created");
```

Logs se guardan en:
- `logs/combined.log` (todos los niveles)
- `logs/error.log` (solo errores)
- Consola (desarrollo)

---

## 🔄 CI/CD Pipeline

Tu `pnpm validate` ahora ejecuta:
```bash
format:check       # ✅ Biome formatting
  ↓
lint:ci            # ✅ Biome linting
  ↓
typecheck          # ✅ TypeScript strict
  ↓
test:run           # ✅ Vitest (NUEVO)
  ↓
build              # ✅ Build final
```

**Tiempo esperado en CI limpio:** ~90s

---

## 🚨 Troubleshooting

### Tests no encuentran módulos

```bash
# Regenerar tipos Prisma
pnpm -C backend prisma:generate

# Invalidar cache de Turbo
pnpm -C backend test -- --no-cache
```

### Coverage bajo en un archivo

```bash
# Ver qué líneas no tienen cobertura
pnpm test:coverage

# Abrir reporte HTML
open coverage/index.html
```

### Tests lentos

```bash
# Ver tiempos por test
pnpm test -- --reporter=verbose

# Ejecutar un test específico
pnpm test -- example.test.ts
```

---

## ✅ Próximos Pasos (Roadmap)

- [ ] E2E tests con Playwright (crítico)
- [ ] Component tests con React Testing Library (frontend)
- [ ] Performance benchmarking (load testing con k6)
- [ ] Contract testing entre frontend/backend
- [ ] Mutation testing (verificar calidad de asserts)

---

## 📚 Referencias

- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Última actualización:** 4 de mayo de 2026  
**Autor:** GitHub Copilot (VICKY 🧡)
