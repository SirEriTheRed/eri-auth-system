import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Registers the `GET /refresh` endpoint that issues a new access token using a valid refresh token.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * The route reads the `refreshToken` cookie and verifies it via `refreshJwtVerify`.
 * The verification includes the `trusted` callback that checks whether the token
 * has been revoked.
 *
 * On success the old refresh token is revoked and a new one is issued (token
 * rotation), the new refresh token is set as a cookie, and the new access token
 * is returned.
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

    const userId = request.refreshUser.userId;

    const oldToken = request.cookies.refreshToken;

    const newRefreshToken = await reply.refreshJwtSign({ userId });
    const decodedRefresh = fastify.jwt.refresh.decode(newRefreshToken);

    if (decodedRefresh == null) {
      return reply.status(401).send({ error: 'Refresh token invalid, please log in' });
    }

    if (oldToken) {
      await fastify.revokeToken(oldToken);
    }

    await fastify.createRefreshToken(userId, newRefreshToken, new Date(decodedRefresh.exp * 1000));

    const newAccessToken = await reply.accessJwtSign({ userId });

    reply
      .status(200)
      .setCookie('refreshToken', newRefreshToken, {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'none',
      })
      .send({ accessToken: newAccessToken });
  });
};
