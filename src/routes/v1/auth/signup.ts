import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

const UserSignup = Type.Object({
  id: Type.String(),
  email: Type.String({ format: 'email' }),
  birthday: Type.String({ format: 'date' }),
});
type UserSignupBody = Static<typeof UserSignup>;

export const signupRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post(
    '/signup',
    { schema: { body: UserSignup } },
    async (request: FastifyRequest<{ Body: UserSignupBody }>, reply: FastifyReply) => {
      const body: UserSignupBody = request.body;
      try {
        await fastify.createUser(body.id, body.email, body.birthday);
        reply.status(201).send('User created sucessfully');
      } catch (error: unknown) {
        let errorMessage = await fastify.analyseError(error);
        errorMessage ??= 'Unknown error during signup';
        reply.status(500).send(errorMessage);
      }
    }
  );
};
