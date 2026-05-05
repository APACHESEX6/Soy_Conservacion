/// <reference types="node" />
import "dotenv/config";

import type { PrismaConfig } from "prisma";

// Prisma config file — leído por la CLI de Prisma (migrate, generate, studio, etc.)
// El adapter de pg se configura en src/config/prisma.ts para el runtime.
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies PrismaConfig;
