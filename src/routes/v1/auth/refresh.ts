import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify';

/**
 * Registers the `POST /refresh` endpoint that issues a new access token using a valid refresh token.
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
 * Returns a 403 with `{ statusCode: 403, error: 'Forbidden', message: 'Cross-origin request forbidden' }`
 * if the request includes an `Origin` header that is not in the configured allowed origins.
 *
 * Returns a 401 with `{ statusCode: 401, error: 'Unauthorized', message: 'Refresh token invalid, please log in' }`
 * if the refresh token is missing, expired, revoked, or otherwise invalid.
 *
 * @example
 * ```typescript
 * // Request:  POST /auth/refresh
 * // Cookie:   refreshToken=eyJhbGciOiJIUzI1NiIs...
 * // Response: 200
 * // Body:     { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
 * ```
 */
export const refreshRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post('/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.refreshJwtVerify({ onlyCookie: true });
    } catch {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token invalid, please log in',
      });
    }

    const origin = request.headers.origin;
    if (origin && !fastify.allowedOrigins.includes(origin)) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Cross-origin request forbidden',
      });
    }

    const userId = request.refreshUser.userId;

    const oldToken = request.cookies.refreshToken;

    const newRefreshToken = await reply.refreshJwtSign({ userId });
    const decodedRefresh = fastify.jwt.refresh.decode<{ exp: number }>(newRefreshToken);

    if (decodedRefresh == null) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Refresh token invalid, please log in',
      });
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
        sameSite: 'lax',
      })
      .send({ accessToken: newAccessToken });
  });
};
