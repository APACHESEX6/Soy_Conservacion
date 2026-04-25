import dotenv from "dotenv";
import app from "./app";
import { checkDatabaseConnection, disconnectDatabase } from "./config/database";
import { createEtlScheduler } from "./etl/etlScheduler";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[38;5;250m",
  cyan: "\x1b[38;5;153m",
  mint: "\x1b[38;5;121m",
  green: "\x1b[38;5;120m",
  yellow: "\x1b[38;5;223m",
  red: "\x1b[38;5;210m",
  violet: "\x1b[38;5;183m",
  white: "\x1b[38;5;255m",
  bold: "\x1b[1m",
};

const now = () => new Date().toISOString();
const PANEL_WIDTH = 78;
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const stripAnsi = (value: string): string => value.replace(ANSI_PATTERN, "");
const panelLine = (left: string): string => {
  const spaces = Math.max(1, PANEL_WIDTH - stripAnsi(left).length - 4);
  return `${color.cyan}│${color.reset} ${left}${" ".repeat(spaces)}${color.cyan}│${color.reset}`;
};

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;
const etlScheduler = createEtlScheduler();

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(
    `${color.yellow}[${now()}]${color.reset} ${color.yellow}${signal}${color.reset} Cerrando servidor...`,
  );

  if (server) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
  }

  etlScheduler.stop();

  await disconnectDatabase().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(`${color.red}[DB_CLOSE_FAIL]${color.reset} ${message}`);
  });

  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

const startServer = async (): Promise<void> => {
  const dbConnected = await checkDatabaseConnection();

  if (dbConnected) {
    etlScheduler.start();
  }

  server = app.listen(PORT, () => {
    const dbText = dbConnected
      ? `${color.green}CONECTADA${color.reset}`
      : `${color.red}NO CONECTADA${color.reset}`;

    console.log("");
    console.log(`${color.dim}· ${"─".repeat(PANEL_WIDTH - 6)} ·${color.reset}`);
    console.log(`${color.cyan}┏${"━".repeat(PANEL_WIDTH - 2)}┓${color.reset}`);
    console.log(
      panelLine(
        `${color.bold}${color.white}API ONLINE${color.reset} ${color.violet}| backend listo${color.reset}`,
      ),
    );
    console.log(`${color.cyan}┣${"━".repeat(PANEL_WIDTH - 2)}┫${color.reset}`);
    console.log(
      panelLine(
        `${color.mint}ENDPOINT:${color.reset} ${color.white}http://localhost:${PORT}/health${color.reset}`,
      ),
    );
    console.log(panelLine(`${color.mint}DB STATUS:${color.reset} ${dbText}`));
    console.log(`${color.cyan}┗${"━".repeat(PANEL_WIDTH - 2)}┛${color.reset}`);
    console.log(`${color.dim}· ${"─".repeat(PANEL_WIDTH - 6)} ·${color.reset}`);
    console.log(
      `${color.white}[${now()}]${color.reset} ${color.mint}INFO${color.reset} ${color.white}Servidor iniciado con estilo profesional${color.reset}`,
    );
    console.log("");
  });
};

startServer().catch((error) => {
  const message = error instanceof Error ? error.message : "Error desconocido";
  console.error(`${color.red}[FATAL]${color.reset} Error al iniciar servidor: ${message}`);
  process.exit(1);
});
