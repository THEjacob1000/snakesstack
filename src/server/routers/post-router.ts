import { db } from "@/db";
import { postsTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import { z } from "zod";
import { router } from "../__internals/router";
import { publicProcedure } from "../procedures";

export const postRouter = router({
	recent: publicProcedure.query(async ({ c }) => {
		const [recentPost] = await db
			.select()
			.from(postsTable)
			.orderBy(desc(postsTable.createdAt))
			.limit(1);

		return c.superjson(recentPost);
	}),

	create: publicProcedure
		.input(z.object({ name: z.string().min(1) }))
		.mutation(async ({ ctx, c, input }) => {
			const { name } = input;
			const [post] = await db.insert(postsTable).values({ name }).returning();

			return c.superjson(post);
		}),
});
