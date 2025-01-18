import { Pool } from "@neondatabase/serverless";
import { Redis } from "@upstash/redis/cloudflare";
import { drizzle } from "drizzle-orm/neon-serverless";
import { env } from "hono/adapter";
import * as schema from "../db/schema";
import { cacheExtension } from "./__internals/db/cache-extension";
import { j } from "./__internals/j";

const extendedDatabaseMiddleware = j.middleware(
  async ({ c, next }) => {
    const variables = env(c);

    const pool = new Pool({
      connectionString: variables.DATABASE_URL,
    });

    const redis = new Redis({
      token: variables.REDIS_TOKEN,
      url: variables.REDIS_URL,
    });

    const db = drizzle(pool, { schema });

    // Apply cache extension (you'll need to modify this for Drizzle)
    const dbWithCache = cacheExtension({ db, redis });

    // Whatever you put inside of `next` is accessible to all following middlewares
    return await next({ db: dbWithCache });
  }
);

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure.use(
  extendedDatabaseMiddleware
);
