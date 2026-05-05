import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().min(1).startsWith("pk."),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:4000"),
});

// For client-side validation, we only check the public variables
const _env = envSchema.safeParse({
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

if (!_env.success) {
  const errorMsg = `❌ Invalid environment variables: ${JSON.stringify(_env.error.format())}`;
  if (typeof window !== "undefined") {
    // biome-ignore lint/suspicious/noConsole: Critical environment validation
    console.error(errorMsg);
  } else {
    // During build or SSR, we might want to fail fast if critical variables are missing
    // However, for Next.js build, some variables might be injected later.
    // For now, let's just log and provide a fallback to avoid undefined errors.
    // biome-ignore lint/suspicious/noConsole: Critical environment validation
    console.error(errorMsg);
  }
}

export const env = _env.data ?? {
  NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000",
};

export const getMapboxToken = () => env.NEXT_PUBLIC_MAPBOX_TOKEN;
