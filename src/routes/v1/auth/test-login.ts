import type { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';

export function testLoginRoute(fastify: FastifyInstance) {
  fastify.get(
    '/testLogin',
    {
      onRequest: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.status(200).send(request.user);
    }
  );
}
