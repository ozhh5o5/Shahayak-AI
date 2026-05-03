import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let url = process.env.DATABASE_URL;

if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/dev.db';
  if (!fs.existsSync(tmpDbPath)) {
    try {
      // Find dev.db in the build output. Depending on where it is, we try process.cwd()
      const sourceDb = path.join(process.cwd(), 'dev.db');
      if (fs.existsSync(sourceDb)) {
        fs.copyFileSync(sourceDb, tmpDbPath);
      } else {
        // Fallback for Prisma paths
        const prismaDb = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(prismaDb)) fs.copyFileSync(prismaDb, tmpDbPath);
      }
    } catch (e) {
      console.warn("Failed to copy db to /tmp", e);
    }
  }
  url = `file:${tmpDbPath}`;
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = globalThis.prisma || new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
