import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Registers the `GET /is-logged-in` endpoint that verifies the current access token.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * Protected by the `authenticate` preHandler hook. On success it returns the
 * decoded access token payload (`request.accessUser`), which contains the `userId`.
 * This is useful for client-side session validation — e.g. checking on app mount
 * whether the stored access token is still valid.
 *
 * @throws Returns a 401 error (via the `authenticate` hook) if the access token
 * is missing, expired, or invalid
 *
 * @example
 * ```typescript
 * // Request:  GET /v1/auth/is-logged-in
 * // Header:   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * // Response: 200
 * // Body:     { "userId": "user-1" }
 * ```
 */
export const isLoggedInRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.get(
    '/is-logged-in',
    {
      onRequest: fastify.authenticate,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      reply.status(200).send(request.accessUser);
    }
  );
};
