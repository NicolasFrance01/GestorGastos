import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DEBUG: DATABASE_URL is UNDEFINED");
  throw new Error("DATABASE_URL is not set in environment variables");
}

console.log(`DEBUG: DATABASE_URL length: ${process.env.DATABASE_URL.length}`);
console.log(`DEBUG: DATABASE_URL prefix: ${process.env.DATABASE_URL.substring(0, 10)}...`);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
// Casting pool to any to resolve a known version mismatch in PrismaNeon types during Vercel builds
const adapter = new PrismaNeon(pool as any);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
