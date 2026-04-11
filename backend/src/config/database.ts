import { prisma } from "./prisma";

const color = {
  reset: "\x1b[0m",
  dim: "\x1b[90m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const now = () => new Date().toISOString();

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
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

export const disconnectDatabase = async (): Promise<void> => {
  await prisma.$disconnect();
};
