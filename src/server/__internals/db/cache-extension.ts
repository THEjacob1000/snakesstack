import type { Redis } from "@upstash/redis/cloudflare";
import superjson, { type SuperJSONResult } from "superjson";
import type { SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import type { SQL } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import type * as schema from "@/db/schema";

export type CacheArgs = { cache?: { id: string; ttl?: number } };

type DbType = NeonHttpDatabase<typeof schema> & {
  $client: NeonQueryFunction<false, false>;
};

function isSuperJSONResult(obj: any): obj is SuperJSONResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "json" in obj &&
    "meta" in obj
  );
}

type DrizzleQueryResult<T> = T extends SQLiteTableWithColumns<any>
  ? T["_"]["inferSelect"][]
  : never;

/**
 * The Drizzle extension to provide built-in caching with Upstash Redis
 */
export const createCacheExtension = ({ redis }: { redis: Redis }) => {
  return {
    findFirst: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      where: SQL | undefined,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>[number] | undefined> => {
      const { cache } = args;

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id);

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<DrizzleQueryResult<T>[number]>(
            cachedResult
          );
        }
      }

      const result = await table.findFirst(where);

      if (cache && result) {
        const serializedResult = superjson.stringify(result);

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          });
        } else {
          await redis.set(cache.id, serializedResult);
        }
      }

      return result;
    },

    findUnique: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      where: SQL,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>[number] | undefined> => {
      const { cache } = args;

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id);

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<DrizzleQueryResult<T>[number]>(
            cachedResult
          );
        }
      }

      const result = await table.findFirst(where);

      if (cache && result) {
        const serializedResult = superjson.stringify(result);

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          });
        } else {
          await redis.set(cache.id, serializedResult);
        }
      }

      return result;
    },

    findMany: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      where: SQL | undefined,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>> => {
      const { cache } = args;

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id);

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<DrizzleQueryResult<T>>(
            cachedResult
          );
        }
      }

      const result = await table.findMany(where);

      if (cache && result) {
        const serializedResult = superjson.stringify(result);

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          });
        } else {
          await redis.set(cache.id, serializedResult);
        }
      }

      return result;
    },

    create: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      values: Partial<T["_"]["inferInsert"]>,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>[number]> => {
      const { cache } = args;

      if (cache) {
        await redis.del(cache.id);
      }

      const result = await table.insert(values).returning();
      return result[0];
    },

    update: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      values: Partial<T["_"]["inferInsert"]>,
      where: SQL,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>[number]> => {
      const { cache } = args;

      if (cache) {
        await redis.del(cache.id);
      }

      const result = await table
        .update(values)
        .where(where)
        .returning();
      return result[0];
    },

    delete: async <T extends SQLiteTableWithColumns<any>>(
      table: T,
      where: SQL,
      args: CacheArgs = {}
    ): Promise<DrizzleQueryResult<T>[number]> => {
      const { cache } = args;

      if (cache) {
        await redis.del(cache.id);
      }

      const result = await table.delete().where(where).returning();
      return result[0];
    },
  };
};
