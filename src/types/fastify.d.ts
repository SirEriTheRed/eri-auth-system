/* eslint-disable @typescript-eslint/no-unused-vars */
import type { VerifyOptions, JWT } from '@fastify/jwt';
import type { FastifyRequest, FastifyReply } from 'fastify';

import type { PluginOptions } from './plugin-options.js';

/**
 * Extended JWT verify options that include a cookie-only verification flag.
 *
 * @remarks
 * Used internally by the refresh token verification flow. When `onlyCookie` is `true`,
 * the parser reads the token exclusively from the cookie instead of the `Authorization` header.
 */
type JwtVerifyOptions = Partial<VerifyOptions> & { onlyCookie?: boolean };

declare module '@fastify/jwt' {
  interface JWT {
    /**
     * Namespace for **access** tokens — short-lived (15 min), verified on every protected route.
     *
     * @remarks
     * Signed and verified using {@link PluginOptions.accessSecret | `accessSecret`}.
     * The decoded payload contains `{ userId: string }`.
     */
    access: JWT;

    /**
     * Namespace for **refresh** tokens — long-lived (7 days), stored in an httpOnly cookie.
     *
     * @remarks
     * Signed and verified using {@link PluginOptions.refreshSecret | `refreshSecret`}.
     * The decoded payload contains `{ userId: string }`.
     * Includes a `trusted` callback that checks revocation status via
     * {@link PluginOptions.getTokenRevokedAt | `getTokenRevokedAt`}.
     */
    refresh: JWT;

    /**
     * Namespace for **password-reset** tokens — short-lived (15 min), embedded in the reset link.
     *
     * @remarks
     * Signed and verified using {@link PluginOptions.resetSecret | `resetSecret`}.
     * The decoded payload contains `{ userId: string }`.
     */
    reset: JWT;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Base URL of the application, used to construct the password-reset link.
     *
     * @remarks
     * Injected from {@link PluginOptions.siteUrl | `PluginOptions.siteUrl`}.
     */
    siteUrl: string;

    /**
     * Minimum age required for user registration.
     *
     * @remarks
     * Decorated from {@link PluginOptions.minimumAge | `PluginOptions.minimumAge`}.
     * When set, the signup route rejects users below this age with a 403 response.
     * `undefined` when the consumer did not configure a minimum age.
     */
    minimumAge?: number;

    /**
     * Access-token verification hook.
     *
     * @param request - The incoming Fastify request
     * @param reply - The outgoing Fastify reply
     *
     * @remarks
     * Used as an `onRequest` or `preHandler` hook on protected routes.
     * Returns a 401 response with `{ error: 'Access token invalid, please refresh the token' }`
     * when verification fails.
     */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    /** @internal Injected from {@link PluginOptions.findUser | `PluginOptions.findUser`}. */
    findUser: PluginOptions['findUser'];

    /** @internal Injected from {@link PluginOptions.createUser | `PluginOptions.createUser`}. */
    createUser: PluginOptions['createUser'];

    /** @internal Injected from {@link PluginOptions.revokeToken | `PluginOptions.revokeToken`}. */
    revokeToken: PluginOptions['revokeToken'];

    /** @internal Injected from {@link PluginOptions.sendResetEmail | `PluginOptions.sendResetEmail`}. */
    sendResetEmail: PluginOptions['sendResetEmail'];

    /** @internal Injected from {@link PluginOptions.createRefreshToken | `PluginOptions.createRefreshToken`}. */
    createRefreshToken: PluginOptions['createRefreshToken'];

    /** @internal Injected from {@link PluginOptions.updateUserPassword | `PluginOptions.updateUserPassword`}. */
    updateUserPassword: PluginOptions['updateUserPassword'];

    /** @internal Injected from {@link PluginOptions.logoutAllDevices | `PluginOptions.logoutAllDevices`}. */
    logoutAllDevices: PluginOptions['logoutAllDevices'];

    /** @internal Injected from {@link PluginOptions.analyseError | `PluginOptions.analyseError`}. */
    analyseError: PluginOptions['analyseError'];
  }

  interface FastifyRequest {
    /**
     * Verifies the **access** JWT from the `Authorization` header.
     *
     * @param options - Optional verification overrides (e.g. `onlyCookie`)
     *
     * @remarks
     * On success, populates `request.accessUser` with the decoded payload.
     * Throws if the token is expired, malformed, or signed with a different secret.
     */
    accessJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;

    /**
     * Verifies the **refresh** JWT from the `refreshToken` cookie.
     *
     * @param options - Optional verification overrides (e.g. `onlyCookie`)
     *
     * @remarks
     * On success, populates `request.refreshUser` with the decoded payload.
     * Also validates against the `trusted` callback that checks revocation status.
     * Throws if the token is expired, revoked, or malformed.
     */
    refreshJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;

    /**
     * Verifies the **reset** JWT (password-reset) from the request body or query.
     *
     * @param options - Optional verification overrides
     *
     * @remarks
     * On success, populates the user context with the decoded payload.
     * Throws if the token is expired or malformed.
     */
    resetJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;

    /**
     * Decoded **access** token payload after a successful `accessJwtVerify` call.
     *
     * @remarks
     * Contains `{ userId: string }`. Only available inside routes that have
     * run the access-token verification hook.
     */
    accessUser: { userId: string };

    /**
     * Decoded **refresh** token payload after a successful `refreshJwtVerify` call.
     *
     * @remarks
     * Contains `{ userId: string }`. Only available after refresh-token verification.
     */
    refreshUser: { userId: string };
  }

  interface FastifyReply {
    /**
     * Signs and returns a new **access** JWT for the given user.
     *
     * @param payload - Must contain `{ userId: string }`
     * @returns The signed JWT string
     *
     * @remarks
     * Uses the `access` namespace with the consumer-provided `accessSecret`.
     * Token expires in 15 minutes.
     */
    accessJwtSign: (payload: { userId: string }) => Promise<string>;

    /**
     * Signs and returns a new **refresh** JWT for the given user.
     *
     * @param payload - Must contain `{ userId: string }`
     * @returns The signed JWT string
     *
     * @remarks
     * Uses the `refresh` namespace with the consumer-provided `refreshSecret`.
     * Token expires in 7 days. The signed value should also be persisted via
     * {@link PluginOptions.createRefreshToken | `createRefreshToken`}.
     */
    refreshJwtSign: (payload: { userId: string }) => Promise<string>;

    /**
     * Signs and returns a new **reset** JWT (password-reset) for the given user.
     *
     * @param payload - Must contain `{ userId: string }`
     * @returns The signed JWT string
     *
     * @remarks
     * Uses the `reset` namespace with the consumer-provided `resetSecret`.
     * Token expires in 15 minutes. The signed value is embedded in the
     * password-reset link.
     */
    resetJwtSign: (payload: { userId: string }) => Promise<string>;
  }
}
