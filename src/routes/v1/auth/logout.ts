import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Registers the `PATCH /logout` endpoint that revokes the current refresh token.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * The route reads the `refreshToken` cookie, verifies it via `refreshJwtVerify`,
 * and then revokes it through the consumer-provided
 * {@link PluginOptions.revokeToken | `revokeToken`} callback.
 *
 * After a successful logout the refresh cookie is effectively dead — subsequent
 * refresh attempts will fail the `trusted` check in the JWT plugin configuration.
 *
 * @throws Returns a 401 with `{ statusCode: 401, error: 'Unauthorized', message: '...' }` if the
 * refresh token is missing, expired, or has already been revoked
 *
 * @example
 * ```typescript
 * // Request:  PATCH /auth/logout
 * // Cookie:   refreshToken=eyJhbGciOiJIUzI1NiIs...
 * // Response: 200
 * // Body:     { "message": "Logged out successfully" }
 * ```
 */
export const logoutRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.patch(
    '/logout',
    { config: { rawBody: false } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.refreshJwtVerify({ onlyCookie: true });
        await fastify.revokeToken(request.cookies.refreshToken);
      } catch {
        reply.code(401).send({ statusCode: 401, error: 'Unauthorized', message: 'Unauthorized' });
      }
    }
  );
};
