[**@erithered/eri-auth-system**](../README.md)

---

[@erithered/eri-auth-system](../globals.md) / PluginOptions

# Interface: PluginOptions

Defined in: [types/plugin-options.ts:39](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L39)

Re-exported for convenience.

## See

PluginOptions for the complete configuration reference

## Properties

### accessSecret

> **accessSecret**: `string`

Defined in: [types/plugin-options.ts:65](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L65)

Secret used to sign and verify **access** tokens (short-lived, 15-minute expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `access` namespace.
Treat it like a password — generate a strong random value and store it
in an environment variable.

---

### allowedOrigins?

> `optional` **allowedOrigins?**: `string`[]

Defined in: [types/plugin-options.ts:121](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L121)

List of trusted origins allowed to make cross-origin requests to auth endpoints.

#### Default Value

The origin extracted from [\`siteUrl\`](#siteurl)

#### Remarks

Used to validate the `Origin` header on the `/refresh` endpoint. If the request
includes an `Origin` header that is not in this list, the route returns a 403.
When omitted, defaults to the origin portion of `siteUrl`.

Add entries here if your frontend runs on a different origin than `siteUrl`.

#### Example

```ts
['https://app.example.com', 'https://staging.example.com'];
```

---

### analyseError

> **analyseError**: (`error`) => `Promise`\<\{ `message`: `string`; `statusCode`: `number`; \} \| `null`\>

Defined in: [types/plugin-options.ts:230](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L230)

Callback that translates a raw error into a user-facing response.

#### Parameters

##### error

`unknown`

The caught exception (typically from the consumer's own DB call)

#### Returns

`Promise`\<\{ `message`: `string`; `statusCode`: `number`; \} \| `null`\>

An object with the HTTP status code and a user-facing message,
or `null` to fall back to a generic 500 error

#### Remarks

The signup route catches errors from **`createUser`** and passes them here.
The returned `statusCode` replaces the default 500, and `message` is sent
as the response body. Return `null` if the error is not recognised — the
route will fall back to a generic "Unknown error during signup" message.

#### Example

```typescript
analyseError: async (error) =>
  error instanceof DuplicateUserError
    ? { message: 'This user ID is already taken', statusCode: 409 }
    : null,
```

---

### createRefreshToken

> **createRefreshToken**: (`userId`, `token`, `expiresAt`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:146](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L146)

Callback that stores a new refresh token in your persistence layer.

#### Parameters

##### userId

`string`

The user who owns this refresh token

##### token

`string`

The raw JWT refresh token string

##### expiresAt

`Date`

The moment this token expires (derived from the JWT `exp` claim)

#### Returns

`Promise`\<`void`\>

#### Remarks

The stored token must be retrievable later for revocation checks via
[\`getTokenRevokedAt\`](#gettokenrevokedat).

---

### createUser

> **createUser**: (`userId`, `email`, `birthday`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:207](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L207)

Callback that creates a new user record.

#### Parameters

##### userId

`string`

The chosen user identifier

##### email

`string`

The user's email address

##### birthday

`string`

The user's date of birth

#### Returns

`Promise`\<`void`\>

#### Remarks

Called during signup. The consumer is responsible for persisting these
fields and for any additional validation (e.g. email uniqueness).

---

### findUser

> **findUser**: (`userId`) => `Promise`\<\{ `email`: `string`; `hashedPassword`: `string`; `id`: `string`; \} \| `null`\>

Defined in: [types/plugin-options.ts:158](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L158)

Callback that looks up a user by ID.

#### Parameters

##### userId

`string`

The unique identifier of the user to find

#### Returns

`Promise`\<\{ `email`: `string`; `hashedPassword`: `string`; `id`: `string`; \} \| `null`\>

The user record — `null` if no user exists with that ID

#### Remarks

Returned user must include the argon2-hashed password so the login route
can verify credentials.

---

### getTokenRevokedAt

> **getTokenRevokedAt**: (`refreshToken`) => `Promise`\<`Date` \| `null`\>

Defined in: [types/plugin-options.ts:244](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L244)

Callback that checks whether a refresh token has been revoked.

#### Parameters

##### refreshToken

`string`

The raw JWT refresh token to inspect

#### Returns

`Promise`\<`Date` \| `null`\>

The revocation timestamp, or `null` if the token is still valid

#### Remarks

Called by `@fastify/jwt`'s `trusted` function on every request that
includes a refresh cookie. A non-null `Date` means the token was
revoked and should be rejected even if the JWT itself is still
cryptographically valid.

---

### logoutAllDevices

> **logoutAllDevices**: (`userId`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:194](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L194)

Callback that revokes all active refresh tokens for a user.

#### Parameters

##### userId

`string`

The user whose tokens should be invalidated

#### Returns

`Promise`\<`void`\>

#### Remarks

Called during password reset to force re-authentication on all devices.

---

### minimumAge?

> `optional` **minimumAge?**: `number`

Defined in: [types/plugin-options.ts:104](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L104)

Minimum age required for user registration.

#### Remarks

When set, the signup route validates the user's calculated age (from their
birthday) against this value and rejects underaged users with a 403 response
before calling `createUser`. When omitted, no age validation is performed.

---

### prefix?

> `optional` **prefix?**: `string`

Defined in: [types/plugin-options.ts:55](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L55)

URL prefix for all auth routes.

#### Default Value

```ts
'/auth';
```

#### Remarks

All seven route endpoints are registered under this prefix.
The prefix is applied via Fastify's `register` prefix option,
so route files define only their local paths (e.g. `/login`).

#### Example

```ts
'/v1/auth'   → routes become /v1/auth/login, /v1/auth/logout, …
'/api/auth'  → routes become /api/auth/login, /api/auth/logout, …
'/auth'      → routes become /auth/login, /auth/logout, …
```

---

### refreshSecret

> **refreshSecret**: `string`

Defined in: [types/plugin-options.ts:76](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L76)

Secret used to sign and verify **refresh** tokens (long-lived, 7-day expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `refresh` namespace.
The refresh token is stored in an httpOnly cookie and also persisted via
[\`createRefreshToken\`](#createrefreshtoken) so it can be
revoked on logout.

---

### resetSecret

> **resetSecret**: `string`

Defined in: [types/plugin-options.ts:86](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L86)

Secret used to sign and verify **password-reset** tokens (short-lived, 15-minute expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `reset` namespace.
The signed token is embedded in the reset link sent via
[\`sendResetEmail\`](#sendresetemail).

---

### revokeToken

> **revokeToken**: (`refreshToken`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:171](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L171)

Callback that marks a refresh token as revoked.

#### Parameters

##### refreshToken

`string` \| `undefined`

The raw JWT refresh token to invalidate (may be `undefined`)

#### Returns

`Promise`\<`void`\>

#### Remarks

Called during logout. Once revoked, even a valid unexpired refresh token
will be rejected by the plugin's `trusted` check.

---

### sendResetEmail

> **sendResetEmail**: (`to`, `resetLink`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:133](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L133)

Callback that delivers a password-reset link to the user's email inbox.

#### Parameters

##### to

`string`

Recipient email address

##### resetLink

`string`

Fully-qualified URL containing the reset JWT

#### Returns

`Promise`\<`void`\>

#### Remarks

The link has the form `{siteUrl}/reset-password?token={resetToken}`.
Implementations typically delegate to an SMTP, SendGrid, or SES client.

---

### siteUrl

> **siteUrl**: `string`

Defined in: [types/plugin-options.ts:94](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L94)

Base URL of the application, used to construct the password-reset link.

#### Example

```ts
'https://myapp.com';
```

---

### updateUserPassword

> **updateUserPassword**: (`userId`, `hashedPassword`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:184](https://github.com/SirEriTheRed/eri-auth-system/blob/e63fbe4e0b0d14c5a94c3f3fcebc6f71be3f7dea/src/types/plugin-options.ts#L184)

Callback that updates a user's password hash.

#### Parameters

##### userId

`string`

The user whose password is being changed

##### hashedPassword

`string`

The new argon2 hash to store

#### Returns

`Promise`\<`void`\>

#### Remarks

Called during password reset _after_ the reset token has been verified
and the new password has been confirmed. The caller has already hashed
the password with argon2 — store the result as-is.
