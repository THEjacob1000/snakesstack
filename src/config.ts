export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  localDb: Boolean(process.env.LOCAL_DB) || false,
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/snake_stack",
  vercelUrl: process.env.VERCEL_URL || "your-vercel-url",
}
