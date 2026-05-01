import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DEBUG: DATABASE_URL is UNDEFINED or EMPTY");
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Clean the string to avoid issues with accidental whitespace
const connectionString = process.env.DATABASE_URL.trim();

console.log(`DEBUG: DATABASE_URL detected. Length: ${connectionString.length}`);
console.log(`DEBUG: Starts with postgres: ${connectionString.startsWith("postgres")}`);

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
