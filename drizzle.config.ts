import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		// biome-ignore lint/style/noNonNullAssertion: This is necessary so that the build fails if the environment variable is not set
		url: process.env.DATABASE_URL!,
	},
});
