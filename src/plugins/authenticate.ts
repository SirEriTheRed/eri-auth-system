import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export const authenticate = fp((fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.accessJwtVerify();
    } catch {
      return reply.status(401).send({ error: 'Access token invalid, please refresh the token' });
    }
  });
});
