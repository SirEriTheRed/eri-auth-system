import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { hash } from 'argon2';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

const PwdResetBody = Type.Object({
  token: Type.String(),
  password: Type.String({ minLength: 8 }),
  passwordConfirm: Type.String({ minLength: 8 }),
});

type PwdResetBody = Static<typeof PwdResetBody>;

export const pwdResetRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.patch(
    '/pwdReset',
    { schema: { body: PwdResetBody } },
    async (request: FastifyRequest<{ Body: PwdResetBody }>, reply: FastifyReply) => {
      const body: PwdResetBody = request.body;

      let user: { userId: string };
      try {
        user = await fastify.jwt.reset.verify(body.token);
      } catch {
        return reply.status(401).send('This link is invalid link');
      }

      const userId = user.userId;

      if (body.password !== body.passwordConfirm) {
        return reply.status(400).send('Passwords do not match');
      }

      try {
        await fastify.updateUserPassword(userId, await hash(body.password));

        await fastify.logoutAllDevices(userId);

        reply.status(201).send('Password reset sucessfully');
      } catch {
        const errorMessage = 'Unknown error during password reset';

        reply.status(500).send(errorMessage);
      }
    }
  );
};
