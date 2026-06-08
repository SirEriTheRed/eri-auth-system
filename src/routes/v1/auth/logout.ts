import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default async (fastify: FastifyInstance) => {
  fastify.patch(
    "/logout",
    { config: { rawBody: false } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.refreshJwtVerify({ onlyCookie: true });
        await fastify.prisma.refreshToken.update({
          where: {
            token: request.cookies.refreshToken,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      } catch (error) {
        reply.code(401).send({ error: error });
      }
    },
  );
};
