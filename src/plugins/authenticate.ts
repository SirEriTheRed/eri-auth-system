/**
 * Plugin that decorates the Fastify instance with an `authenticate` preHandler hook.
 *
 * @remarks
 * The registered `authenticate` decorator verifies the JWT access token on every
 * request where it is used as an `onRequest` or `preHandler` hook. If verification
 * fails, the request is rejected with a 401 status and a descriptive error message.
 *
 * The hook uses `@fastify/jwt`'s `request.accessJwtVerify()` under the hood.
 * It is wrapped in `fastify-plugin` so it is available to all sibling plugins
 * (i.e. all route registrations in `src/index.ts`).
 *
 * @example
 * ```typescript
 * // Registering the plugin (done internally by authPlugin)
 * fastify.register(authenticate);
 *
 * // Using the decorator on a protected route
 * fastify.get('/me', { onRequest: fastify.authenticate }, handler);
 * ```
 */
import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export const authenticate = fp((fastify) => {
  /**
   * Verifies the JWT access token from the current request.
   *
   * @param request - The incoming Fastify request containing the access token
   * @param reply - The outgoing Fastify reply used to send the 401 response on failure
   *
   * @remarks
   * On successful verification the request flow continues normally.
   * On failure the reply sends a 401 with
   * `{ statusCode: 401, error: 'Unauthorized', message: 'Access token invalid, please refresh the token' }`
   * and processing stops — the route handler is never invoked.
   *
   * @throws Never throws to the caller — failures are caught internally and converted
   * to a structured 401 JSON response.
   */
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.accessJwtVerify();
    } catch {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Access token invalid, please refresh the token',
      });
    }
  });
});
