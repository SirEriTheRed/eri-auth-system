import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

export const logoutRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.patch(
    '/logout',
    { config: { rawBody: false } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.refreshJwtVerify({ onlyCookie: true });
        await fastify.revokeToken(request.cookies.refeshToken);
      } catch (error) {
        reply.code(401).send({ error: error });
      }
    }
  );
};
