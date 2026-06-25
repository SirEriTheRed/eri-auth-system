import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { hash } from 'argon2';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

/**
 * JSON body schema for the password-reset submission.
 *
 * @remarks
 * Expects the reset JWT (received via email link), the new password, and a
 * confirmation. Both passwords must match and be at least 8 characters long.
 */
const PwdResetBody = Type.Object({
  /** The reset JWT from the email link (signed with the `reset` namespace) */
  token: Type.String(),

  /** The new password — minimum 8 characters */
  password: Type.String({ minLength: 8 }),

  /** Confirmation of the new password — must match `password` */
  passwordConfirm: Type.String({ minLength: 8 }),
});

type PwdResetBody = Static<typeof PwdResetBody>;

/**
 * Registers the `PATCH /pwdReset` endpoint that completes the password-reset flow.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * Verification flow:
 * 1. Verify the reset JWT from the request body
 * 2. Check that the two passwords match
 * 3. Hash the new password with argon2
 * 4. Update the stored password via
 *    {@link PluginOptions.updateUserPassword | `updateUserPassword`}
 * 5. Revoke all existing sessions via
 *    {@link PluginOptions.logoutAllDevices | `logoutAllDevices`}
 *
 * After a successful reset the user must log in again on all devices.
 *
 * @throws Returns a 401 if the reset token is expired or malformed
 * @throws Returns a 400 if the passwords do not match
 * @throws Returns a 500 on unexpected errors during password update
 *
 * @example
 * ```typescript
 * // Request:  PATCH /auth/pwdReset
 * // Body:     {
 * //             "token": "eyJhbGciOiJIUzI1NiIs...",
 * //             "password": "newS3cret!",
 * //             "passwordConfirm": "newS3cret!"
 * //           }
 * // Response: 201
 * // Body:     "Password reset sucessfully"
 * ```
 */
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
        return reply.status(401).send('This link is invalid');
      }

      const userId = user.userId;

      if (body.password !== body.passwordConfirm) {
        return reply.status(400).send('Passwords do not match');
      }

      try {
        await fastify.updateUserPassword(userId, await hash(body.password));

        await fastify.logoutAllDevices(userId);

        reply.status(201).send('Password reset successfully');
      } catch {
        const errorMessage = 'Unknown error during password reset';

        reply.status(500).send(errorMessage);
      }
    }
  );
};
