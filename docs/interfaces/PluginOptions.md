[**@EriTheRed/eri-auth-system**](../README.md)

---

[@EriTheRed/eri-auth-system](../README.md) / PluginOptions

# Interface: PluginOptions

Defined in: [types/plugin-options.ts:38](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L38)

Re-exported for convenience.

## See

PluginOptions for the complete configuration reference

## Properties

### accessSecret

> **accessSecret**: `string`

Defined in: [types/plugin-options.ts:47](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L47)

Secret used to sign and verify **access** tokens (short-lived, 15-minute expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `access` namespace.
Treat it like a password — generate a strong random value and store it
in an environment variable.

---

### analyseError

> **analyseError**: (`error`) => `Promise`\<`string` \| `null`\>

Defined in: [types/plugin-options.ts:175](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L175)

Callback that translates a raw error into a user-facing message.

#### Parameters

##### error

`unknown`

The caught exception (typically from the consumer's own DB call)

#### Returns

`Promise`\<`string` \| `null`\>

A user-facing message string, or `null` to fall back to the default error

#### Remarks

The signup route catches errors from `createUser` and passes them here.
Return `null` if the error is not recognised — the route will fall back
to a generic "Unknown error during signup" message.

---

### createRefreshToken

> **createRefreshToken**: (`userId`, `token`, `expiresAt`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:101](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L101)

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

Defined in: [types/plugin-options.ts:162](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L162)

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

Defined in: [types/plugin-options.ts:113](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L113)

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

Defined in: [types/plugin-options.ts:189](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L189)

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

Defined in: [types/plugin-options.ts:149](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L149)

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

### refreshSecret

> **refreshSecret**: `string`

Defined in: [types/plugin-options.ts:58](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L58)

Secret used to sign and verify **refresh** tokens (long-lived, 7-day expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `refresh` namespace.
The refresh token is stored in an httpOnly cookie and also persisted via
[\`createRefreshToken\`](#createrefreshtoken) so it can be
revoked on logout.

---

### resetSecret

> **resetSecret**: `string`

Defined in: [types/plugin-options.ts:68](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L68)

Secret used to sign and verify **password-reset** tokens (short-lived, 15-minute expiry).

#### Remarks

This secret is passed directly to `@fastify/jwt`'s `reset` namespace.
The signed token is embedded in the reset link sent via
[\`sendResetEmail\`](#sendresetemail).

---

### revokeToken

> **revokeToken**: (`refreshToken`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:126](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L126)

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

Defined in: [types/plugin-options.ts:88](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L88)

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

Defined in: [types/plugin-options.ts:76](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L76)

Base URL of the application, used to construct the password-reset link.

#### Example

```ts
'https://myapp.com';
```

---

### updateUserPassword

> **updateUserPassword**: (`userId`, `hashedPassword`) => `Promise`\<`void`\>

Defined in: [types/plugin-options.ts:139](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/types/plugin-options.ts#L139)

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
