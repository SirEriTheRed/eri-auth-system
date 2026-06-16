import type { FastifyReply, FastifyRequest, FastifyInstance } from 'fastify';

/**
 * Registers the `GET /testLogin` endpoint that returns the authenticated user's payload.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @deprecated This route is **orphaned** — it is not registered in `src/index.ts`
 * and is not wired into the main plugin. It exists as a development/testing helper
 * and should not be used in production. Use the `authenticate` decorator directly
 * on your own protected routes instead.
 *
 * @remarks
 * Protected by the `authenticate` preHandler hook. On success it returns the
 * decoded JWT payload (`request.user`), which contains the `userId`.
 *
 * @example
 * ```typescript
 * // Request:  GET /v1/auth/testLogin
 * // Header:   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * // Response: 200
 * // Body:     { "userId": "user-1" }
 * ```
 */
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
