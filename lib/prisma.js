import { PrismaClient } from '@prisma/client';

// This singleton pattern ensures that you only have one instance of PrismaClient
// in your application, preventing connection pool exhaustion.

let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production, always create a new instance
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance
  // across hot-reloads.
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
