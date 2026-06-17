import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Registers the `GET /refresh` endpoint that issues a new access token using a valid refresh token.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * The route reads the `refreshToken` cookie and verifies it via `refreshJwtVerify`.
 * The verification includes the `trusted` callback that checks whether the token
 * has been revoked. On success a new access token is signed and returned.
 *
 * No new refresh token is issued — the existing one is reused until it expires (7 days)
 * or is explicitly revoked via logout.
 *
 * @throws Returns a 401 with `{ error: 'Refresh token invalid, please log in' }` if the
 * refresh token is missing, expired, revoked, or otherwise invalid
 *
 * @example
 * ```typescript
 * // Request:  GET /auth/refresh
 * // Cookie:   refreshToken=eyJhbGciOiJIUzI1NiIs...
 * // Response: 200
 * // Body:     { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
 * ```
 */
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
