

import { PrismaClient } from "@prisma/client";

// Ensures that in development, multiple hot reloads don't create new clients
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Only use datasourceUrl for connection configuration
    datasourceUrl: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Database connection function with retry logic for sleeping databases
export async function connectWithRetry(maxRetries = 3, retryDelay = 2000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`; // Test query
      console.log("Database connection successful.");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`Database connection attempt ${i + 1} failed:`, errorMessage);
      
      if (i === maxRetries - 1) {
        console.error("Max retries reached. Database connection failed.");
        return false;
      }
      
      console.log(`Retrying in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Exponential backoff
      retryDelay *= 2;
    }
  }
  return false;
}

// Keep connection alive function for Neon
export async function keepConnectionAlive() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database keepalive successful");
  } catch (error) {
    console.log("Database keepalive failed, attempting reconnect...");
    await connectWithRetry();
  }
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
