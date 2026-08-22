import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Recursive Proxy builder to mock DB operations when database server is unavailable
function createMockPrismaProxy(): PrismaClient {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }
      if (typeof prop === 'symbol') return undefined;

      // Return a function that can be invoked or chained with properties
      const mockFn = (..._args: unknown[]) => Promise.resolve(null);
      return new Proxy(mockFn, {
        get(_fnTarget, subProp) {
          if (subProp === 'then') return undefined;
          return (..._args: unknown[]) => Promise.resolve(null);
        },
        apply(_fnTarget, _thisArg, _args) {
          return Promise.resolve(null);
        }
      });
    }
  };
  return new Proxy({}, handler) as PrismaClient;
}

function initializeDb(): PrismaClient {
  if (process.env.DATABASE_URL) {
    try {
      return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
    } catch (e) {
      console.warn("PrismaClient init failed, using mock proxy:", e);
      return createMockPrismaProxy();
    }
  }
  return createMockPrismaProxy();
}

export const db = globalForPrisma.prisma ?? initializeDb();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
