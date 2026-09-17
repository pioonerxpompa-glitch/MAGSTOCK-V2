import type { FastifyInstance } from "fastify";
import { db } from "./db.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health/deep", async (_request, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return { ok: true, database: "online", timestamp: new Date().toISOString() };
    } catch {
      return reply.code(503).send({ ok: false, database: "offline", timestamp: new Date().toISOString() });
    }
  });
}
