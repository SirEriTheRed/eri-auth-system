import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

const askPwdResetBody = Type.Object({
  userId: Type.String(),
});
type askPwdResetBody = Static<typeof askPwdResetBody>;

export const askPwdResetRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post(
    '/askPwdReset',
    { schema: { body: askPwdResetBody } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as askPwdResetBody;

      const user = await fastify.findUser(body.userId);

      if (user == null) {
        throw new Error('User not found');
      }

      const resetToken = await reply.resetJwtSign({ userId: user.id });
      const resetLink = `${fastify.siteUrl}/reset-password?token=${resetToken}`;
      await fastify.sendResetEmail(user.email, resetLink);
    }
  );
};
