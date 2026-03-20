import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
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

app.use(helmet());
app.use(cors());
app.use(express.json());

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
