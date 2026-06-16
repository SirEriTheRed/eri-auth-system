# @erithered/eri-auth-system

[![npm version](https://img.shields.io/npm/v/@erithered/eri-auth-system)](https://www.npmjs.com/package/@erithered/eri-auth-system)
[![build](https://img.shields.io/github/actions/workflow/status/EriTheRed/eri-auth-system/quality.yml?branch=main)](https://github.com/EriTheRed/eri-auth-system/actions)
[![coverage](https://img.shields.io/badge/coverage-80%25-brightgreen)](https://github.com/EriTheRed/eri-auth-system)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

Fastify auth plugin with JWT access/refresh/reset tokens, email-based password reset, and logout-all-devices support.

**Coded by a human, assisted by AI** to set up a comprehensive code quality framework (strict TypeScript, ESLint + Prettier, knip, husky + lint-staged, conventional commits, vitest with 80%+ coverage, semantic-release, publint, attw, cspell) and extracted from its original project into a standalone publishable package.

## Installation

```sh
npm install @erithered/eri-auth-system
```

**Peer dependencies** — your application must provide these:

```sh
npm install fastify @fastify/jwt @fastify/cookie @sinclair/typebox
```

## Quick Start

```typescript
import Fastify from 'fastify';
import { authPlugin, type PluginOptions } from '@erithered/eri-auth-system';

const app = Fastify();

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
    db.refreshTokens.insert({ userId, token, expiresAt }),
  updateUserPassword: async (userId, hash) => db.users.updatePassword(userId, hash),
  logoutAllDevices: async (userId) => db.tokens.revokeAll(userId),
  analyseError: async (err) => (err.code === 'P2002' ? 'This user ID is already taken' : null),
  getTokenRevokedAt: async (token) => db.tokens.revokedAt(token),
});

await app.listen({ port: 3000 });
```

## Routes

All routes are registered under the `/v1/auth` prefix.

| Method | Path                    | Auth   | Description                                     |
| ------ | ----------------------- | ------ | ----------------------------------------------- |
| POST   | `/v1/auth/signup`       | —      | Create a new user account                       |
| POST   | `/v1/auth/login`        | —      | Authenticate with ID + password                 |
| GET    | `/v1/auth/refresh`      | Cookie | Rotate the access token using the refresh token |
| PATCH  | `/v1/auth/logout`       | Cookie | Revoke the current refresh token                |
| POST   | `/v1/auth/askPwdReset`  | —      | Request a password-reset email                  |
| PATCH  | `/v1/auth/pwdReset`     | Token  | Complete a password reset                       |
| GET    | `/v1/auth/is-logged-in` | Bearer | Validate the current access token               |

- **Auth: Cookie** — requires a signed `refreshToken` cookie
- **Auth: Bearer** — requires an `Authorization: Bearer <token>` header
- **Auth: Token** — token is sent in the request body

### Response format

Successful responses return JSON or plain text. All errors follow this shape (customisable via the `analyseError` callback):

```json
{ "statusCode": 401, "error": "Invalid credentials", "message": "This password is invalid" }
```

## PluginOptions

All fields are **required**. The plugin validates their presence at registration time.

### Secrets

| Field           | Type     | Description                                                                   |
| --------------- | -------- | ----------------------------------------------------------------------------- |
| `accessSecret`  | `string` | Secret for signing/verifying short-lived **access** JWT (15 min)              |
| `refreshSecret` | `string` | Secret for signing/verifying long-lived **refresh** JWT (7 days)              |
| `resetSecret`   | `string` | Secret for signing/verifying **password-reset** JWT (15 min)                  |
| `siteUrl`       | `string` | Base URL used to construct the password-reset link (e.g. `https://myapp.com`) |

### Callbacks

| Callback             | Signature                                                            | Called when…                                                          |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `findUser`           | `(userId: string) => Promise<{ id, hashedPassword, email } \| null>` | Login, password reset — looks up a user by ID                         |
| `createUser`         | `(userId: string, email: string, birthday: string) => Promise<void>` | Signup — creates a new user record                                    |
| `revokeToken`        | `(token: string \| undefined) => Promise<void>`                      | Logout — marks a refresh token as revoked                             |
| `sendResetEmail`     | `(to: string, resetLink: string) => Promise<void>`                   | Password reset request — delivers the reset link                      |
| `createRefreshToken` | `(userId: string, token: string, expiresAt: Date) => Promise<void>`  | Login — persists a refresh token for later revocation                 |
| `updateUserPassword` | `(userId: string, hashedPassword: string) => Promise<void>`          | Password reset — updates the stored password hash                     |
| `logoutAllDevices`   | `(userId: string) => Promise<void>`                                  | Password reset — revokes all active refresh tokens                    |
| `analyseError`       | `(error: unknown) => Promise<string \| null>`                        | Error handling — maps a caught error to a user-facing message         |
| `getTokenRevokedAt`  | `(token: string) => Promise<Date \| null>`                           | Every request with a refresh cookie — checks if the token was revoked |

## JWT Namespaces

Three isolated [@fastify/jwt](https://github.com/fastify/fastify-jwt) namespaces, each with its own secret and purpose:

| Namespace   | Decorator             | Expiry | Transport                                |
| ----------- | --------------------- | ------ | ---------------------------------------- |
| **access**  | `request.accessUser`  | 15 min | `Authorization: Bearer` header           |
| **refresh** | `request.refreshUser` | 7 days | Signed HTTP-only cookie (`refreshToken`) |
| **reset**   | —                     | 15 min | URL query parameter (sent via email)     |

The refresh namespace includes a `trusted` function that checks revocation status via `getTokenRevokedAt` — even a valid, unexpired refresh token is rejected if it has been revoked.

## TypeScript

This package is fully typed. Augmentations for `FastifyInstance`, `FastifyRequest`, and `FastifyReply` are provided in `src/types/fastify.d.ts` and are automatically available when you import the plugin.

```typescript
import { authPlugin, type PluginOptions } from '@erithered/eri-auth-system';
```

### Type augmentation in your app

If you need to reference the auth decorators on your Fastify instance, add a `fastify.d.ts` file:

```typescript
import '@erithered/eri-auth-system';
```

## Development

```sh
npm install
```

### Scripts

| Command                | Action                                                          |
| ---------------------- | --------------------------------------------------------------- |
| `npm run lint`         | ESLint (strict type-checked rules)                              |
| `npm run type-check`   | TypeScript compiler check (`tsc --noEmit`)                      |
| `npm run format:check` | Prettier formatting check                                       |
| `npm test`             | Run 39 integration tests with coverage (80% threshold)          |
| `npm run knip`         | Dead-code and unused-dependency analysis                        |
| `npm run check:pack`   | publint + attw — validates package metadata and type resolution |
| `npm run lint:spell`   | Spell-check all source files                                    |
| `npm run docs`         | Generate TypeDoc API documentation                              |
| `npm run analyze`      | knip + depcheck combined                                        |

### Pre-commit hooks

- ESLint + Prettier run automatically via husky + lint-staged
- `npm run type-check` runs on staged `.ts` files
- Conventional commits enforced via commitlint

## Release

This package uses [semantic-release](https://semantic-release.gitbook.io/) with conventional commits.

```sh
npm run release:dry   # Preview the next version
npm run release       # Publish to npm
```

Commit messages follow the [Angular convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit):

- `feat:` — new feature (minor version bump)
- `fix:` — bug fix (patch version bump)
- `BREAKING CHANGE:` — incompatible API change (major version bump)
- `chore:`, `docs:`, `refactor:`, `test:`, etc. — no version bump

## License

ISC
