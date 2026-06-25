import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

/**
 * JSON body schema for the password-reset request.
 *
 * @remarks
 * Only requires the user identifier — the actual reset token is generated
 * server-side and sent via email.
 */
const askPwdResetBody = Type.Object({
  /** The identifier of the user requesting a password reset */
  userId: Type.String(),
});
type askPwdResetBody = Static<typeof askPwdResetBody>;

/**
 * Registers the `POST /askPwdReset` endpoint that initiates a password-reset flow.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * The route looks up the user by ID, signs a short-lived reset JWT, constructs
 * a reset link (`{siteUrl}/reset-password?token={resetToken}`), and delivers it
 * via the consumer-provided
 * {@link PluginOptions.sendResetEmail | `sendResetEmail`} callback.
 *
 * If the user ID does not exist a generic 200 is returned (no email sent) to
 * prevent user-enumeration attacks.
 *
 * @example
 * ```typescript
 * // Request:  POST /auth/askPwdReset
 * // Body:     { "userId": "user-1" }
 * // Response: 200 (no body — email is sent asynchronously)
 * ```
 */
export const askPwdResetRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post(
    '/askPwdReset',
    { schema: { body: askPwdResetBody } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as askPwdResetBody;

      const user = await fastify.findUser(body.userId);

      if (user == null) {
        return reply.status(200).send();
      }

      const resetToken = await reply.resetJwtSign({ userId: user.id });
      const resetLink = `${fastify.siteUrl}/reset-password?token=${resetToken}`;
      await fastify.sendResetEmail(user.email, resetLink);
    }
  );
};
