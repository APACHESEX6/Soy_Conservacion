import winston from "winston";

/**
 * Structured logging with Winston 3.15+
 * Usage:
 *   logger.info("User created", { userId: 123, email: "test@example.com" })
 *   logger.error("Database error", { code: "ECONNREFUSED" })
 */

const isDevelopment = process.env.NODE_ENV === "development";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ["message", "level", "timestamp", "label"],
  }),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  format: logFormat,
  defaultMeta: { service: "soy-conservacion-backend" },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
          const { timestamp, level, message, metadata } = info as {
            timestamp: string;
            level: string;
            message: string;
            metadata?: Record<string, unknown>;
          };
          const meta = (metadata ?? {}) as Record<string, unknown>;
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} [${level}] ${message}${metaStr}`;
        }),
      ),
    }),

    // Error file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Don't log during tests
if (process.env.NODE_ENV === "test") {
  logger.transports.forEach((transport) => {
    transport.silent = true;
  });
}

export default logger;
