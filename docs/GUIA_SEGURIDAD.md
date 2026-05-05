# 🔒 Security & Observability Guide — Soy Conservación 2026

**Estándar:** OWASP Top 10 2023 + Best Practices 2026

---

## 🛡️ Seguridad Implementada

### ✅ Authentication & Authorization
- [x] **Helmet.js**: Establece security headers HTTP
- [x] **CORS**: Restricción de orígenes configurada (whitelist)
- [x] **Rate Limiting**: 120 req/min por IP (configurable)
- [x] **Secrets Check**: Pre-commit hook para API keys

**Próximos:**
- [ ] JWT/Session tokens con rotación
- [ ] RBAC (Role-Based Access Control)
- [ ] OAuth 2.1 / OIDC para social login

---

### ✅ Input Validation
- [x] **Zod**: Schema validation en frontend y backend
- [x] **Express JSON**: Límite de body (1MB)
- [x] **Prisma ORM**: Previene SQL injection automáticamente

**Cómo usarlo:**
```typescript
import { z } from "zod";

const CreateEspecieSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().optional(),
  grupo_id: z.number().int().positive(),
});

const data = CreateEspecieSchema.parse(request.body);
```

---

### ✅ Dependency Security
- [x] **Dependabot**: Actualizaciones automáticas de dependencias
- [x] **npm audit**: Verificación en CI/CD
- [x] **GitHub CodeQL**: SAST (Static Application Security Testing)
- [x] **Lockfiles**: `pnpm-lock.yaml` frozen en CI

**Ejecutar auditoría manual:**
```bash
pnpm audit --prod    # Solo dependencias de producción
pnpm audit           # Todo incluyendo dev
pnpm audit fix       # Auto-fix vulnerabilidades menores
```

---

### ✅ Secrets Management
- [x] **`.env.example`**: Plantilla sin valores reales
- [x] **Git hooks**: Pre-commit detecta patrones de secrets
- [x] **`.gitignore`**: `.env` no commiteado

**Patrones detectados:**
```
AIza[0-9A-Za-z-_]{35}      # Google API keys
ghp_[0-9A-Za-z]{36}        # GitHub PATs
xox[baprs]-[0-9]{12}-...   # Slack tokens
```

**Usar secretos en CI:**
```bash
# GitHub Actions - agregar en Settings > Secrets
DATABASE_URL=...
CORS_ORIGINS=...
```

---

## 📊 Observabilidad

### ✅ Structured Logging (Winston 3.15+)

**Configuración:**
```typescript
import logger from "../utils/logger";

// Logging structured con metadatos
logger.info("Observacion created", {
  observacionId: 123,
  userId: 456,
  especieId: 789,
  location: { lat: 4.5, lng: -74.3 },
});

logger.error("ETL sync failed", {
  source: "inaturalist",
  reason: "API timeout",
  retries: 3,
  nextRetry: "2026-05-04T15:00:00Z",
});

logger.warn("Database connection slow", {
  duration_ms: 2500,
  threshold_ms: 1000,
});
```

**Niveles:**
- `error`: Fallos que requieren acción inmediata
- `warn`: Situaciones inesperadas pero recuperables
- `info`: Eventos importantes (login, cambios de datos)
- `debug`: Información detallada para troubleshooting

**Archivos de log:**
- `logs/combined.log`: Todos los niveles
- `logs/error.log`: Solo errores (5 archivos, 10MB cada uno)

---

### ⚠️ Observabilidad Faltante (Próxima Fase)

```
[ ] OpenTelemetry tracing
    - Distributed tracing entre frontend/backend
    - Request correlation IDs
    - Span annotations

[ ] Metrics (Prometheus-compatible)
    - Latencia de API endpoints
    - Rate de errores
    - Database query times
    - ETL sync success rate

[ ] Error Tracking (Sentry)
    - Captura automática de unhandled exceptions
    - Source maps para stack traces
    - Session replay (opcional)

[ ] Alerting
    - CPU/Memory usage > 80%
    - Error rate > 1%
    - API latency > 2s
    - Database replication lag > 10s
```

---

## 🔍 Health Checks (K8s Ready)

### Endpoints Implementados

```bash
GET /health
  → { "status": "healthy", "timestamp": "...", "uptime": 3600.5 }
  → Usado por: Load balancers, health dashboards

GET /ready
  → Readiness probe para K8s
  → Verifica: Database connectivity, external APIs, etc.

GET /live
  → Liveness probe para K8s
  → Si falla → Kubernetes reinicia el pod
```

**Configuración en K8s (próxima):**
```yaml
livenessProbe:
  httpGet:
    path: /live
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 🚨 Security Headers (Helmet.js)

Automáticamente configurados:

| Header | Valor | Propósito |
|--------|-------|----------|
| `Strict-Transport-Security` | `max-age=31536000` | Fuerza HTTPS |
| `X-Content-Type-Options` | `nosniff` | Previene MIME sniffing |
| `X-Frame-Options` | `DENY` | Previene clickjacking |
| `Content-Security-Policy` | `default-src 'self'` | Previene XSS (básico) |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |

**Personalizar en `app.ts`:**
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

## 🛡️ CORS Policy

**Configuración actual:**
```typescript
CORS_ORIGINS=http://localhost:3000,https://example.com

// En app.ts:
const allowedOrigins = process.env.CORS_ORIGINS.split(",");

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
```

**Actualizar para producción:**
```bash
CORS_ORIGINS=https://tudominio.com,https://api.tudominio.com
```

---

## 🔐 Rate Limiting

**Configuración actual:**
```
- Ventana: 60 segundos (configurable)
- Límite: 120 peticiones por IP
- Skip: /health (no limita health checks)
```

**Respuesta cuando se excede:**
```json
{
  "ok": false,
  "error": "Demasiadas solicitudes. Intenta de nuevo en unos minutos."
}
```

**Personalizar:**
```bash
RATE_LIMIT_WINDOW_MS=60000   # 1 minuto
RATE_LIMIT_MAX=120            # 120 requests
```

---

## 📝 OWASP Top 10 2023 Coverage

| Riesgo | Estado | Mitigación |
|--------|--------|------------|
| **A1: Broken Access Control** | 🟡 Parcial | CORS + Rate limiting |
| **A2: Cryptographic Failures** | ✅ Cubierto | TLS (configure en reverse proxy) |
| **A3: Injection** | ✅ Cubierto | Prisma ORM + Zod validation |
| **A4: Insecure Design** | ✅ Cubierto | Tests + Helmet security headers |
| **A5: Security Misconfiguration** | 🟡 Parcial | SecurityHeaders configurado |
| **A6: Vulnerable Components** | ✅ Cubierto | Dependabot + npm audit en CI |
| **A7: Identification Failures** | 🟡 Parcial | Rate limiting en lugar de auth real |
| **A8: Data Integrity Failures** | ✅ Cubierto | Input validation + Prisma |
| **A9: Logging & Monitoring** | ✅ Cubierto | Winston logging + Health checks |
| **A10: SSRF** | ✅ Cubierto | Zod validation en URLs |

---

## 🚀 Checklist de Deployment Seguro

```bash
# Pre-deployment
[ ] npm audit --prod sin vulnerabilidades críticas
[ ] Todos los tests pasando
[ ] CodeQL analysis sin issues críticos
[ ] Environment variables configuradas
[ ] CORS_ORIGINS actualizado a dominios reales
[ ] LOG_LEVEL configurado a 'info' en producción
[ ] DATABASE_URL con conexión segura

# Post-deployment
[ ] Health checks respondiendo
[ ] Readiness probe OK
[ ] Logs sin errores de conexión
[ ] Monitorear rate limiting
[ ] Verificar HTTPS en navegador
```

---

## 📚 Referencias

- [OWASP Top 10 2023](https://owasp.org/www-project-top-ten/)
- [Helmet.js Security Headers](https://helmetjs.github.io/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Zod Validation](https://zod.dev/)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/queries/raw-database-access)

---

**Última actualización:** 4 de mayo de 2026  
**Revisión de seguridad:** Mensual
