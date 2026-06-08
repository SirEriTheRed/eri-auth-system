import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

export default fp(async (fastify) => {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.accessJwtVerify();
      } catch {
        return reply
          .status(401)
          .send({ error: "Access token invalid, please refresh the token" });
      }
    },
  );
});
