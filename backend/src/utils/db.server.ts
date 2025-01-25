import { PrismaClient } from "@prisma/client";

// Singleton of Data Source
let db: PrismaClient;

declare global {
  var __dbClient: PrismaClient | undefined;
}

if (!global.__dbClient) {
  global.__dbClient = new PrismaClient();
}

db = global.__dbClient;

export { db };
