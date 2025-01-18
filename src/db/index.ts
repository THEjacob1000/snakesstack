import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "@/config";
import ws from "ws";
import * as schema from "./schema";
export * from "./schema";

declare global {
	// eslint-disable-next-line no-var -- `var` is used for `cachedDb` to ensure it's properly added to the global scope, allowing it to be accessed and modified across different parts of the application.
	var cachedDb: ReturnType<typeof drizzle<typeof schema>>;
}

let db: ReturnType<typeof drizzle<typeof schema>>;

if (config.localDb) {
	neonConfig.fetchEndpoint = (host) => {
		const [protocol, port] = ["http", 4444];
		return `${protocol}://${host}:${port}/sql`;
	};
	neonConfig.useSecureWebSocket = false;
	neonConfig.wsProxy = (host) => `${host}:4444/v1`;
	neonConfig.webSocketConstructor = ws;
	const parsedDatabaseURL = new URL(config.databaseUrl);
	parsedDatabaseURL.host = "db.localtest.me"; // Magic string here 🤷
	config.databaseUrl = parsedDatabaseURL.toString();
}

if (config.nodeEnv === "production") {
	// In production, create a new connection for each request
	const sql = neon(config.databaseUrl);
	db = drizzle(sql, { schema });
} else {
	// In development, reuse the connection
	if (!global.cachedDb) {
		const sql = neon(config.databaseUrl);
		global.cachedDb = drizzle(sql, { schema });
	}
	db = global.cachedDb;
}

export { db };
