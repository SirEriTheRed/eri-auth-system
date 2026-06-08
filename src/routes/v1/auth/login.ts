import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { verify } from 'argon2';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

const UserLogin = Type.Object({
  id: Type.String(),
  password: Type.String(),
});
type UserLoginBody = Static<typeof UserLogin>;

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
        console.log(error);
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
