[**@EriTheRed/eri-auth-system**](../README.md)

---

[@EriTheRed/eri-auth-system](../README.md) / authPlugin

# Variable: authPlugin

> `const` **authPlugin**: `FastifyPluginCallback`\<[`PluginOptions`](../interfaces/PluginOptions.md)\>

Defined in: [index.ts:174](https://github.com/SirEriTheRed/eri-auth-system/blob/7a806e63cc6f2d6bcb7a6cb66906bdd0a5cfc888/src/index.ts#L174)

Ready-to-use Fastify plugin that adds complete JWT authentication.

## Type Param

**opts**

[PluginOptions](../interfaces/PluginOptions.md) — all configuration and callbacks are required

## Remarks

Registers the following on your Fastify instance:

**Decorators:**

- `fastify.authenticate` — preHandler hook that verifies the access JWT
- `fastify.findUser`, `fastify.createUser`, etc. — your callbacks

**Third-party plugins:**

- `@fastify/cookie` — cookie parsing and setting
- `@fastify/jwt` — three namespaces: `access` (15 min), `refresh` (7 days with revocation check), `reset` (15 min)

**Routes (all under `/v1/auth`):**

- `POST /login` — authenticate with ID + password
- `PATCH /logout` — revoke the refresh token
- `POST /signup` — create a new user
- `GET /refresh` — rotate the access token using the refresh cookie
- `POST /askPwdReset` — request a password-reset email
- `PATCH /pwdReset` — complete the password reset

## Example

```typescript
import fastify from 'fastify';
import { authPlugin } from '@EriTheRed/eri-auth-system';

const app = fastify();

await app.register(authPlugin, {
  accessSecret: process.env.ACCESS_SECRET!,
  refreshSecret: process.env.REFRESH_SECRET!,
  resetSecret: process.env.RESET_SECRET!,
  siteUrl: 'https://myapp.com',
  findUser: async (id) => db.users.findById(id),
  createUser: async (id, email, birthday) => db.users.create(id, email, birthday),
  revokeToken: async (token) => db.tokens.revoke(token),
  sendResetEmail: async (to, link) => mailer.send(to, link),
  createRefreshToken: async (userId, token, expiresAt) =>
    db.tokens.insert({ userId, token, expiresAt }),
  updateUserPassword: async (userId, hash) => db.users.updatePassword(userId, hash),
  logoutAllDevices: async (userId) => db.tokens.revokeAll(userId),
  analyseError: async (err) => (err.code === 'P2002' ? 'ID already taken' : null),
  getTokenRevokedAt: async (token) => db.tokens.revokedAt(token),
});

await app.listen({ port: 3000 });
```

## See

[PluginOptions](../interfaces/PluginOptions.md) for the complete configuration interface
