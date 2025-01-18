import type { Redis } from "@upstash/redis/cloudflare"
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"
import superjson, { type SuperJSONResult } from "superjson"
import type * as schema from "@/db/schema"
import type { NeonQueryFunction } from "@neondatabase/serverless"
import type { SQL, SQLWrapper, Table } from "drizzle-orm"

export type CacheArgs = { cache?: { id: string; ttl?: number } }

function isSuperJSONResult(obj: unknown): obj is SuperJSONResult {
  return (
    typeof obj === "object" && obj !== null && "json" in obj && "meta" in obj
  )
}

type DbType = NeonHttpDatabase<typeof schema> & {
  $client: NeonQueryFunction<false, false>
}

export function cacheExtension(db: DbType, redis: Redis) {
  return {
    async findFirst<T extends Table>(
      table: T,
      args: { where?: SQLWrapper | undefined } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id)

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<T["_"]["inferSelect"]>(cachedResult)
        }
      }

      const result = await db
        .select()
        .from(table)
        .where(rest.where as SQL<unknown> | undefined)
        .limit(1)
        .execute()

      if (cache && result.length > 0) {
        const serializedResult = superjson.stringify(result[0])

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          })
        } else {
          await redis.set(cache.id, serializedResult)
        }
      }

      if (Array.isArray(result) && result.length > 0) {
        return result[0] as T["_"]["inferSelect"]
      }
      return null
    },

    async findUnique<T extends Table>(
      table: T,
      args: { where: SQLWrapper } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id)

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<T["_"]["inferSelect"]>(cachedResult)
        }
      }

      const result = await db
        .select()
        .from(table)
        .where(rest.where as SQL<unknown> | undefined)
        .execute()

      if (cache && result.length > 0) {
        const serializedResult = superjson.stringify(result[0])

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          })
        } else {
          await redis.set(cache.id, serializedResult)
        }
      }

      return result[0] as T["_"]["inferSelect"]
    },

    async findMany<T extends Table>(
      table: T,
      args: { where?: SQLWrapper | undefined } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        const cachedResult = await redis.get<string>(cache.id)

        if (cachedResult && isSuperJSONResult(cachedResult)) {
          return superjson.deserialize<T["_"]["inferSelect"][]>(cachedResult)
        }
      }

      const result = await db
        .select()
        .from(table)
        .where(rest.where as SQL<unknown> | undefined)
        .execute()

      if (cache && result.length > 0) {
        const serializedResult = superjson.stringify(result)

        if (cache.ttl) {
          await redis.set(cache.id, serializedResult, {
            ex: cache.ttl,
          })
        } else {
          await redis.set(cache.id, serializedResult)
        }
      }

      return result as T["_"]["inferSelect"][]
    },

    async create<T extends Table>(
      table: T,
      args: { data: T["_"]["inferInsert"] } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        await redis.del(cache.id)
      }

      const result = await db
        .insert(table)
        .values(rest.data)
        .returning()
        .execute()

      if (Array.isArray(result) && result.length > 0) {
        return result[0] as T["_"]["inferSelect"]
      }
    },

    async update<T extends Table>(
      table: T,
      args: {
        where: SQLWrapper
        data: Partial<T["_"]["inferInsert"]>
      } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        await redis.del(cache.id)
      }

      const result = await db
        .update(table)
        .set(rest.data)
        .where(rest.where as SQL<unknown> | undefined)
        .returning()
        .execute()

      if (Array.isArray(result) && result.length > 0) {
        return result[0] as T["_"]["inferSelect"]
      }
    },

    async delete<T extends Table>(
      table: T,
      args: { where: SQLWrapper } & CacheArgs
    ) {
      const { cache: _cache, ...rest } = args
      const cache = _cache as CacheArgs["cache"]

      if (cache) {
        await redis.del(cache.id)
      }

      const result = await db
        .delete(table)
        .where(rest.where as SQL<unknown> | undefined)
        .returning()
        .execute()

      if (Array.isArray(result) && result.length > 0) {
        return result[0] as T["_"]["inferSelect"]
      }
    },
  }
}
