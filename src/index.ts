/**
 * @packageDocumentation
 * # `@erithered/eri-auth-system`
 *
 * A Fastify plugin that adds JWT-based authentication with **access**, **refresh**,
 * and **password-reset** token namespaces, automatic cookie handling, and seven
 * pre-built auth routes under a configurable prefix (default `/auth`).
 *
 * ## Quick start
 *
 * ```typescript
 * import fastify from 'fastify';
 * import { authPlugin } from '@erithered/eri-auth-system';
 *
 * const app = fastify();
 *
 * await app.register(authPlugin, {
 *   accessSecret: process.env.JWT_ACCESS_SECRET!,
 *   refreshSecret: process.env.JWT_REFRESH_SECRET!,
 *   resetSecret: process.env.JWT_RESET_SECRET!,
 *   siteUrl: 'https://example.com',
 *   // ... all PluginOptions callbacks
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 *
 * @see {@link PluginOptions} for the full configuration reference
 * @see {@link authPlugin} for the exported plugin
 */
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { authenticate } from './plugins/authenticate.js';
import { askPwdResetRoute } from './routes/v1/auth/ask-pwd-reset.js';
import { isLoggedInRoute } from './routes/v1/auth/is-logged-in.js';
import { loginRoute } from './routes/v1/auth/login.js';
import { logoutRoute } from './routes/v1/auth/logout.js';
import { pwdResetRoute } from './routes/v1/auth/pwd-reset.js';
import { refreshRoute } from './routes/v1/auth/refresh.js';
import { signupRoute } from './routes/v1/auth/signup.js';
import type { PluginOptions } from './types/plugin-options.js';

/** @internal Default prefix used when `PluginOptions.prefix` is not provided. */
export const DEFAULT_ROUTE_PREFIX = '/auth';

/**
 * Internal plugin callback that wires up all decorators, third-party plugins, and routes.
 *
 * @param fastify - The Fastify instance to decorate and register routes on
 * @param opts - User-provided configuration and callbacks
 *
 * @remarks
 * This is the raw `FastifyPluginCallback` before being wrapped by `fastify-plugin`.
 * Consumers should use the exported {@link authPlugin} instead of calling this directly.
 *
 * Setup performed:
 * - Injects all {@link PluginOptions} callbacks as Fastify decorators
 * - Registers `@fastify/cookie` for cookie parsing/setting
 * - Registers three `@fastify/jwt` namespaces (access, refresh, reset) with their own secrets
 * - Registers the {@link authenticate} decorator for route protection
 * - Registers six routes under the configured prefix (default `/auth`): login, logout, signup, refresh, askPwdReset, pwdReset
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-misused-promises
const auth: FastifyPluginCallback<PluginOptions> = async (fastify, opts) => {
  // Validate required options
  const requiredStrings = ['accessSecret', 'refreshSecret', 'resetSecret', 'siteUrl'] as const;
  for (const key of requiredStrings) {
    if (typeof opts[key] !== 'string' || opts[key] === '') {
      throw new Error(`[eri-auth-system] Missing required option: ${key}`);
    }
  }

  const requiredFunctions = [
    'findUser',
    'createUser',
    'revokeToken',
    'sendResetEmail',
    'createRefreshToken',
    'updateUserPassword',
    'logoutAllDevices',
    'analyseError',
    'getTokenRevokedAt',
  ] as const;
  for (const key of requiredFunctions) {
    if (typeof opts[key] !== 'function') {
      throw new Error(`[eri-auth-system] Missing required option: ${key}`);
    }
  }

  // Validate minimumAge
  if (typeof opts.minimumAge !== 'number' || opts.minimumAge < 0) {
    throw new Error('[eri-auth-system] Missing required option: minimumAge');
  }

  // Validate prefix
  const prefix = opts.prefix ?? DEFAULT_ROUTE_PREFIX;
  if (typeof prefix !== 'string' || !prefix.startsWith('/')) {
    throw new Error(
      `[eri-auth-system] Invalid prefix: "${prefix}" — must be a non-empty string starting with "/"`
    );
  }
  if (prefix.length > 1 && prefix.endsWith('/')) {
    throw new Error(`[eri-auth-system] Invalid prefix: "${prefix}" — must not end with "/"`);
  }

  // Scalar decorators + functions from opts
  fastify.decorate('siteUrl', fastify.siteUrl);
  fastify.decorate('minimumAge', opts.minimumAge);
  fastify.decorate('findUser', opts.findUser);
  fastify.decorate('createUser', opts.createUser);
  fastify.decorate('revokeToken', opts.revokeToken);
  fastify.decorate('sendResetEmail', opts.sendResetEmail);
  fastify.decorate('createRefreshToken', opts.createRefreshToken);
  fastify.decorate('updateUserPassword', opts.updateUserPassword);
  fastify.decorate('logoutAllDevices', opts.logoutAllDevices);
  fastify.decorate('analyseError', opts.analyseError);

  // Third-party plugins — no await
  fastify.register(fastifyCookie);

  fastify.register(fastifyJwt, {
    namespace: 'access',
    decoratorName: 'accessUser',
    secret: opts.accessSecret,
    sign: { expiresIn: '15m' },
  });

  fastify.register(fastifyJwt, {
    namespace: 'refresh',
    decoratorName: 'refreshUser',
    secret: opts.refreshSecret,
    sign: { expiresIn: '7d' },
    trusted: async (request: FastifyRequest) => {
      const token = request.cookies.refreshToken;
      if (!token || typeof token !== 'string') return false;
      try {
        const revokedAt = await opts.getTokenRevokedAt(token);
        return revokedAt === null;
      } catch {
        return false;
      }
    },
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  fastify.register(fastifyJwt, {
    namespace: 'reset',
    secret: opts.resetSecret,
    sign: { expiresIn: '15m' },
  });

  // authenticate decorator — fp() guarantees availability for routes
  fastify.register(authenticate);

  // Routes
  fastify.register(loginRoute, { prefix });
  fastify.register(logoutRoute, { prefix });
  fastify.register(signupRoute, { prefix });
  fastify.register(refreshRoute, { prefix });
  fastify.register(askPwdResetRoute, { prefix });
  fastify.register(pwdResetRoute, { prefix });
  fastify.register(isLoggedInRoute, { prefix });
};

/**
 * Ready-to-use Fastify plugin that adds complete JWT authentication.
 *
 * @typeParam opts - {@link PluginOptions} — all configuration and callbacks are required
 *
 * @remarks
 * Registers the following on your Fastify instance:
 *
 * **Decorators:**
 * - `fastify.authenticate` — preHandler hook that verifies the access JWT
 * - `fastify.findUser`, `fastify.createUser`, etc. — your callbacks
 *
 * **Third-party plugins:**
 * - `@fastify/cookie` — cookie parsing and setting
 * - `@fastify/jwt` — three namespaces: `access` (15 min), `refresh` (7 days with revocation check), `reset` (15 min)
 *
 * **Routes (all under the configured prefix, default `/auth`):**
 * - `POST /login` — authenticate with ID + password
 * - `PATCH /logout` — revoke the refresh token
 * - `POST /signup` — create a new user
 * - `GET /refresh` — rotate the access token using the refresh cookie
 * - `GET /is-logged-in` — validate the current access token
 * - `POST /askPwdReset` — request a password-reset email
 * - `PATCH /pwdReset` — complete the password reset
 *
 * @example
 * ```typescript
 * import fastify from 'fastify';
 * import { authPlugin } from '@erithered/eri-auth-system';
 *
 * const app = fastify();
 *
 * await app.register(authPlugin, {
 *   accessSecret: process.env.ACCESS_SECRET!,
 *   refreshSecret: process.env.REFRESH_SECRET!,
 *   resetSecret: process.env.RESET_SECRET!,
 *   siteUrl: 'https://myapp.com',
 *   findUser: async (id) => db.users.findById(id),
 *   createUser: async (id, email, birthday) => db.users.create(id, email, birthday),
 *   revokeToken: async (token) => db.tokens.revoke(token),
 *   sendResetEmail: async (to, link) => mailer.send(to, link),
 *   createRefreshToken: async (userId, token, expiresAt) =>
 *     db.tokens.insert({ userId, token, expiresAt }),
 *   updateUserPassword: async (userId, hash) => db.users.updatePassword(userId, hash),
 *   logoutAllDevices: async (userId) => db.tokens.revokeAll(userId),
 *   analyseError: async (err) => (err.code === 'P2002' ? 'ID already taken' : null),
 *   getTokenRevokedAt: async (token) => db.tokens.revokedAt(token),
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 *
 * @see {@link PluginOptions} for the complete configuration interface
 */
export const authPlugin = fp(auth, {
  name: '@erithered/eri-auth-system',
  fastify: '>=4.0.0',
});

/**
 * Re-exported for convenience.
 *
 * @see {@link PluginOptions} for the complete configuration reference
 */
export type { PluginOptions } from './types/plugin-options.js';
