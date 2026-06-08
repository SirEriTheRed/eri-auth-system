import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

export const refreshRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.get('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.refreshJwtVerify({ onlyCookie: true });
    } catch {
      return reply.status(401).send({ error: 'Refresh token invalid, please log in' });
    }
    const newAccessToken = await reply.accessJwtSign({
      userId: request.refreshUser.userId,
    });
    return { accessToken: newAccessToken };
  });
};
