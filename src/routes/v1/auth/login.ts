import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { verify } from 'argon2';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

/**
 * JSON body schema for the login request.
 *
 * @remarks
 * Expects a user identifier and a plain-text password.
 * The password is verified against the stored argon2 hash via
 * the consumer-provided {@link PluginOptions.findUser | `findUser`} callback.
 */
const UserLogin = Type.Object({
  /** The user's unique identifier */
  id: Type.String(),

  /** The user's plain-text password (will be argon2-verified server-side) */
  password: Type.String(),
});
type UserLoginBody = Static<typeof UserLogin>;

/**
 * Registers the `POST /login` endpoint that authenticates a user by ID and password.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * On success the route returns an access token in the response body and sets
 * a `refreshToken` httpOnly cookie. The refresh token is also persisted via
 * the consumer-provided {@link PluginOptions.createRefreshToken | `createRefreshToken`}
 * callback so it can be revoked on logout.
 *
 * Authentication flow:
 * 1. Look up the user via {@link PluginOptions.findUser | `findUser`}
 * 2. Verify the password against the stored argon2 hash
 * 3. Sign an access token (15 min expiry)
 * 4. Sign a refresh token (7 day expiry) and persist it
 * 5. Return the access token in the body and set the refresh token as a cookie
 *
 * @throws {Error} With `cause: 'Not Found'` if the user ID does not exist — results in a 404 response
 * @throws {Error} With `cause: 'Invalid Password'` if the password does not match — results in a 401 response
 *
 * @example
 * ```typescript
 * // Request:  POST /auth/login
 * // Body:     { "id": "user-1", "password": "s3cret" }
 * // Response: 200
 * // Body:     { "accessToken": "eyJhbGciOiJIUzI1NiIs..." }
 * // Set-Cookie: refreshToken=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=None
 * ```
 */
export const loginRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post(
    '/login',
    { schema: { body: UserLogin } },
    async (request: FastifyRequest<{ Body: UserLoginBody }>, reply: FastifyReply) => {
      const body: UserLoginBody = request.body;
      try {
        const user = await fastify.findUser(body.id);

        if (!user) {
          throw new Error('', { cause: 'Not Found' });
        }

        if (!(await verify(user.hashedPassword, body.password))) {
          throw new Error('', { cause: 'Invalid Password' });
        }
        const accessToken = await reply.accessJwtSign({ userId: user.id });
        const refreshToken = await reply.refreshJwtSign({ userId: user.id });
        const decodedRefresh = fastify.jwt.refresh.decode<{ exp: number }>(refreshToken);

        if (!decodedRefresh) {
          throw new Error('Failed to decode the refresh token');
        }
        await fastify.createRefreshToken(
          user.id,
          refreshToken,
          new Date(decodedRefresh.exp * 1000)
        );

        reply
          .status(200)
          .setCookie('refreshToken', refreshToken, {
            domain: 'localhost',
            path: '/',
            secure: true,
            httpOnly: true,
            sameSite: 'none',
          })
          .send({ accessToken });
      } catch (error) {
        let errorMessage = 'Unknown error during login';
        let errorCode = 401;

        if (error instanceof Error) {
          switch (error.cause) {
            case 'Not Found':
              errorCode = 404;
              errorMessage = 'Could not find an user with this id';
              break;

            case 'Invalid Password':
              errorMessage = 'This password is invalid';
              errorCode = 401;
              break;

            default:
              break;
          }
        }

        reply.status(errorCode).send(errorMessage);
      }
    }
  );
};
