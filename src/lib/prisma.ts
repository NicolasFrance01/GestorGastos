import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Next.js 16/Vercel WebSocket compatibility
neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;

if (!url) {
  console.error("DEBUG: ALL DATABASE URL VARIABLES ARE UNDEFINED");
  throw new Error("No database connection string found in environment variables");
}

const connectionString = url.trim();
console.log(`DEBUG: Connection string length: ${connectionString.length}`);
console.log(`DEBUG: Protocol: ${connectionString.split(":")[0]}`);

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
