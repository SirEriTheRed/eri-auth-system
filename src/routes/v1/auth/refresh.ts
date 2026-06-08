import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default async (fastify: FastifyInstance) => {
  fastify.get(
    "/refresh",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.refreshJwtVerify({ onlyCookie: true });
      } catch (error) {
        return reply
          .status(401)
          .send({ error: "Refresh token invalid, please log in" });
      }
      const newAccessToken = await reply.accessJwtSign({
        userId: request.refreshUser.userId,
      });
      return { accessToken: newAccessToken };
    },
  );
};
