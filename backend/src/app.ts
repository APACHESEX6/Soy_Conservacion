import compression from "compression";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import apiRouter from "./routes/index";

const app = express();

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const now = () => new Date().toISOString();
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 120);
const jsonLimit = process.env.JSON_BODY_LIMIT ?? "1mb";

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  compression({
    // level 1 (zlib fastest): ~80% del ratio de compresión de level 6
    // con ~10% del tiempo de CPU. Evita bloquear el event loop en responses
    // grandes (~150KB de GeoJSON). En producción, delegar a nginx/caddy.
    threshold: 512,
    level: 1,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(
  rateLimit({
    windowMs: Number.isFinite(rateLimitWindowMs) ? rateLimitWindowMs : 60_000,
    max: Number.isFinite(rateLimitMax) ? rateLimitMax : 120,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
    message: {
      ok: false,
      error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
    },
  }),
);
app.use(express.json({ limit: jsonLimit }));

// Log estructurado de peticiones para detectar fallos de API.
app.use((req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const elapsed = Date.now() - startedAt;
    const method = req.method.toUpperCase();
    const path = req.originalUrl;
    const status = res.statusCode;
    const statusColor = status >= 500 ? color.red : status >= 400 ? color.yellow : color.green;
    const statusLabel = status >= 400 ? "API_FAIL" : "API_OK";
    console.log(
      `${color.dim}[${now()}]${color.reset} ${statusColor}${statusLabel}${color.reset} ${method} ${path} -> ${statusColor}${status}${color.reset} ${elapsed}ms`,
    );
  });
  next();
});

app.use("/api", apiRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    message: "Servicio saludable",
    timestamp: now(),
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada",
  });
});

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  void next;
  console.error(`${color.red}[API_ERROR]${color.reset} ${err.message}`);
  res.status(500).json({
    ok: false,
    error: "Error interno del servidor",
  });
});

export default app;
