/**
 * Configuration options that consumers must provide when registering the auth plugin.
 *
 * @remarks
 * Every property is required. The plugin does NOT provide defaults — you supply
 * secrets, callback implementations, and the site URL. Most callbacks are
 * expected to interact with your own database or external services.
 *
 * @example
 * ```typescript
 * import fastify from 'fastify';
 * import { authPlugin } from '@erithered/eri-auth-system';
 *
 * const app = fastify();
 * await app.register(authPlugin, {
 *   accessSecret: process.env.JWT_ACCESS_SECRET,
 *   refreshSecret: process.env.JWT_REFRESH_SECRET,
 *   resetSecret: process.env.JWT_RESET_SECRET,
 *   siteUrl: 'https://example.com',
 *   findUser: async (id) => db.users.findById(id),
 *   createUser: async (id, email, birthday) => db.users.create(id, email, birthday),
 *   revokeToken: async (token) => db.tokens.markRevoked(token),
 *   sendResetEmail: async (to, link) => emailService.send(to, link),
 *   createRefreshToken: async (userId, token, expiresAt) =>
 *     db.refreshTokens.insert({ userId, token, expiresAt }),
 *   updateUserPassword: async (userId, hashedPassword) =>
 *     db.users.updatePassword(userId, hashedPassword),
 *   logoutAllDevices: async (userId) => db.tokens.revokeAllForUser(userId),
 *   analyseError: async (error) => error instanceof DuplicateUserError
 *     ? 'A user with this ID already exists'
 *     : null,
 *   getTokenRevokedAt: async (token) => db.tokens.findRevokedAt(token),
 * });
 * ```
 */
import '@fastify/cookie';

export interface PluginOptions {
  /**
   * Secret used to sign and verify **access** tokens (short-lived, 15-minute expiry).
   *
   * @remarks
   * This secret is passed directly to `@fastify/jwt`'s `access` namespace.
   * Treat it like a password — generate a strong random value and store it
   * in an environment variable.
   */
  accessSecret: string;

  /**
   * Secret used to sign and verify **refresh** tokens (long-lived, 7-day expiry).
   *
   * @remarks
   * This secret is passed directly to `@fastify/jwt`'s `refresh` namespace.
   * The refresh token is stored in an httpOnly cookie and also persisted via
   * {@link PluginOptions.createRefreshToken | `createRefreshToken`} so it can be
   * revoked on logout.
   */
  refreshSecret: string;

  /**
   * Secret used to sign and verify **password-reset** tokens (short-lived, 15-minute expiry).
   *
   * @remarks
   * This secret is passed directly to `@fastify/jwt`'s `reset` namespace.
   * The signed token is embedded in the reset link sent via
   * {@link PluginOptions.sendResetEmail | `sendResetEmail`}.
   */
  resetSecret: string;

  /**
   * Base URL of the application, used to construct the password-reset link.
   *
   * @example
   * 'https://myapp.com'
   */
  siteUrl: string;

  /**
   * Minimum age required for user registration.
   *
   * @remarks
   * Users whose calculated age (from their birthday) is below this value are
   * rejected during signup. An `Error('User is underaged')` is thrown and
   * forwarded to {@link PluginOptions.analyseError | `analyseError`}.
   */
  minimumAge: number;

  /**
   * Callback that delivers a password-reset link to the user's email inbox.
   *
   * @param to - Recipient email address
   * @param resetLink - Fully-qualified URL containing the reset JWT
   *
   * @remarks
   * The link has the form `{siteUrl}/reset-password?token={resetToken}`.
   * Implementations typically delegate to an SMTP, SendGrid, or SES client.
   */
  sendResetEmail: (to: string, resetLink: string) => Promise<void>;

  /**
   * Callback that stores a new refresh token in your persistence layer.
   *
   * @param userId - The user who owns this refresh token
   * @param token - The raw JWT refresh token string
   * @param expiresAt - The moment this token expires (derived from the JWT `exp` claim)
   *
   * @remarks
   * The stored token must be retrievable later for revocation checks via
   * {@link PluginOptions.getTokenRevokedAt | `getTokenRevokedAt`}.
   */
  createRefreshToken: (userId: string, token: string, expiresAt: Date) => Promise<void>;

  /**
   * Callback that looks up a user by ID.
   *
   * @param userId - The unique identifier of the user to find
   * @returns The user record — `null` if no user exists with that ID
   *
   * @remarks
   * Returned user must include the argon2-hashed password so the login route
   * can verify credentials.
   */
  findUser: (
    userId: string
  ) => Promise<{ id: string; hashedPassword: string; email: string } | null>;

  /**
   * Callback that marks a refresh token as revoked.
   *
   * @param refreshToken - The raw JWT refresh token to invalidate (may be `undefined`)
   *
   * @remarks
   * Called during logout. Once revoked, even a valid unexpired refresh token
   * will be rejected by the plugin's `trusted` check.
   */
  revokeToken: (refreshToken: string | undefined) => Promise<void>;

  /**
   * Callback that updates a user's password hash.
   *
   * @param userId - The user whose password is being changed
   * @param hashedPassword - The new argon2 hash to store
   *
   * @remarks
   * Called during password reset *after* the reset token has been verified
   * and the new password has been confirmed. The caller has already hashed
   * the password with argon2 — store the result as-is.
   */
  updateUserPassword: (userId: string, hashedPassword: string) => Promise<void>;

  /**
   * Callback that revokes all active refresh tokens for a user.
   *
   * @param userId - The user whose tokens should be invalidated
   *
   * @remarks
   * Called during password reset to force re-authentication on all devices.
   */
  logoutAllDevices: (userId: string) => Promise<void>;

  /**
   * Callback that creates a new user record.
   *
   * @param userId - The chosen user identifier
   * @param email - The user's email address
   * @param birthday - The user's date of birth
   *
   * @remarks
   * Called during signup. The consumer is responsible for persisting these
   * fields and for any additional validation (e.g. email uniqueness).
   */
  createUser: (userId: string, email: string, birthday: string) => Promise<void>;

  /**
   * Callback that translates a raw error into a user-facing message.
   *
   * @param error - The caught exception (typically from the consumer's own DB call)
   * @returns A user-facing message string, or `null` to fall back to the default error
   *
   * @remarks
   * The signup route catches errors from **`createUser` and age validation**,
   * then passes them here. Age is calculated as:
   * ```
   * age = today.getFullYear() - birthday.getFullYear();
   * if (today's month/day is before birthday) age--;
   * ```
   * When the calculated age is below `minimumAge`, an
   * `Error('User is underaged')` is thrown — your callback should translate
   * this into a user-facing message.
   * Return `null` if the error is not recognised — the route will fall back
   * to a generic "Unknown error during signup" message.
   */
  analyseError: (error: unknown) => Promise<string | null>;

  /**
   * Callback that checks whether a refresh token has been revoked.
   *
   * @param refreshToken - The raw JWT refresh token to inspect
   * @returns The revocation timestamp, or `null` if the token is still valid
   *
   * @remarks
   * Called by `@fastify/jwt`'s `trusted` function on every request that
   * includes a refresh cookie. A non-null `Date` means the token was
   * revoked and should be rejected even if the JWT itself is still
   * cryptographically valid.
   */
  getTokenRevokedAt: (refreshToken: string) => Promise<Date | null>;
}
