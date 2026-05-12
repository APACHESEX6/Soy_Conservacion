import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(4000),
  DATABASE_URL: z.string().url(),
  MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_FILE: z.string().optional(),
  INAT_PROJECT_ID: z.string().optional(),
  INAT_API_BASE_URL: z.string().url().default("https://api.inaturalist.org/v1"),
  INAT_USER_AGENT: z.string().default("soy-conservacion-backend/1.0"),
  INAT_LOOKBACK_MINUTES: z.string().transform(Number).default(120),
  INAT_FULL_SYNC: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  INAT_PER_PAGE: z.string().transform(Number).default(200),
  INAT_MAX_PAGES: z.string().transform(Number).default(3),
  INAT_HTTP_RETRIES: z.string().transform(Number).default(3),
  INAT_HTTP_TIMEOUT_MS: z.string().transform(Number).default(15000),
  ETL_CRON_SCHEDULE: z.string().default("0 * * * *"), // Every hour
  ETL_PREFETCH_CHUNK_SIZE: z.string().transform(Number).default(500),
  ETL_CONCURRENCY: z.string().transform(Number).default(4),
  DRIVE_ETL_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
  INAT_ETL_ENABLED: z
    .string()
    .default("true")
    .transform((v) => v === "true"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // biome-ignore lint/suspicious/noConsole: Critical error logging for environment variables
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
