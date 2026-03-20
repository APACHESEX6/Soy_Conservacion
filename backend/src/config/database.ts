import { Pool } from "pg";

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const now = () => new Date().toISOString();

let pool: Pool | null = null;
let initialized = false;

export const checkDatabaseConnection = async (): Promise<boolean> => {
  if (!initialized) {
    initialized = true;
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      pool = new Pool({ connectionString });
      pool.on("error", (error) => {
        console.error(
          `${color.dim}[${now()}]${color.reset} ${color.red}DB_FAIL${color.reset} Conexion de base de datos interrumpida: ${error.message}`,
        );
      });
    }
  }

  if (!pool) {
    console.warn(
      `${color.dim}[${now()}]${color.reset} ${color.yellow}DB_DISCONNECTED${color.reset} No se detecto DATABASE_URL en variables de entorno`,
    );
    return false;
  }

  try {
    await pool.query("SELECT 1");
    console.log(
      `${color.dim}[${now()}]${color.reset} ${color.green}DB_CONNECTED${color.reset} Conexion a base de datos establecida`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error(
      `${color.dim}[${now()}]${color.reset} ${color.red}DB_FAIL${color.reset} No fue posible conectar con la base de datos: ${message}`,
    );
    return false;
  }
};
