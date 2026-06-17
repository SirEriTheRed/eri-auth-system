import type { Static } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyReply, FastifyRequest, FastifyInstance, FastifyPluginCallback } from 'fastify';

import { getAge } from '../../../utils/get-age.js';

/**
 * JSON body schema for the signup request.
 *
 * @remarks
 * Expects a user identifier, a valid email address, and a date-of-birth string.
 * Server-side validation is minimal — the consumer's `createUser` callback is
 * expected to enforce any additional constraints (e.g. email uniqueness).
 */
const UserSignup = Type.Object({
  /** The desired user identifier */
  id: Type.String(),

  /** The user's email address (validated against the `email` format) */
  email: Type.String({ format: 'email' }),

  /** The user's date of birth (validated against the `date` format) */
  birthday: Type.String({ format: 'date' }),
});
type UserSignupBody = Static<typeof UserSignup>;

/**
 * Registers the `POST /signup` endpoint that creates a new user account.
 *
 * @param fastify - The Fastify instance used to register the route
 *
 * @remarks
 * When `fastify.minimumAge` is set, computes the user's age from `birthday`
 * using {@link getAge} and rejects the registration with a 403 response if
 * the age is below the threshold.
 *
 * Delegates user creation to the consumer-provided
 * {@link PluginOptions.createUser | `createUser`} callback. Error handling
 * for `createUser` failures is delegated to the consumer-provided
 * {@link PluginOptions.analyseError | `analyseError`} callback.
 *
 * @throws If `analyseError` returns `null` the route falls back to a generic
 * 500 error
 *
 * @example
 * ```typescript
 * // Request:  POST /auth/signup
 * // Body:     { "id": "user-1", "email": "user@example.com", "birthday": "1990-01-15" }
 * // Response: 201
 * // Body:     "User created sucessfully"
 * ```
 */
export const signupRoute: FastifyPluginCallback = (fastify: FastifyInstance) => {
  fastify.post(
    '/signup',
    { schema: { body: UserSignup } },
    async (request: FastifyRequest<{ Body: UserSignupBody }>, reply: FastifyReply) => {
      const body: UserSignupBody = request.body;
      if (fastify.minimumAge !== undefined) {
        const birthday: Date = new Date(body.birthday);
        const age = getAge(birthday);
        if (age < fastify.minimumAge) {
          return reply.status(403).send('User does not meet the minimum age requirement');
        }
      }
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
