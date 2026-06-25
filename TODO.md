# TODO · eri-auth-system

Issues identified during code review, prioritised by severity.

---

## 🔴 High

- [x] **H1** `src/routes/v1/auth/login.ts:63-67` — Throw-for-control-flow antipattern: `throw new Error('', { cause: '...' })` with empty message. Replace with early `return reply.status(x).send(y)`. (Changed to `reply.status().send() + return`, also consolidated not-found/wrong-password into `401 Invalid credentials` to prevent user enumeration.)
- [x] **H2** `src/routes/v1/auth/login.ts:92-112` — DB errors incorrectly return 401: if `findUser` throws (e.g. DB down), the generic catch returns `401 Unknown error`. Infrastructure errors should 500.
- [x] **H3** `src/routes/v1/auth/refresh.ts:28-33` + `login.ts:84-89` — CSRF-vulnerable: `/refresh` is GET (fetchable cross-origin via `<img>`/`<script>`), cookie is `sameSite: 'none'`, no CSRF token or Origin check. Change to POST, add Origin validation.
- [x] **H4** `README.md:153-159` — Documented error contract is wrong: README claims all errors follow `{ statusCode, error, message }` but actual responses are a mix of plain strings and `{ error }` objects.
- [x] **H5** all routes — Inconsistent response format: some return plain strings, some return JSON objects, some return nothing. Unify to a single JSON contract.
- [x] **H6** `src/routes/v1/auth/signup.ts:66-73` — `analyseError` only changes the error message, never the HTTP status code. Duplicate user gets 500, should be 409. Change return type to `{ message: string; statusCode: number } | null`.
- [ ] **H7** `src/routes/v1/auth/signup.ts:60` + `src/utils/get-age.ts:15` — Time-zone off-by-one in age validation: `new Date('YYYY-MM-DD')` parses as UTC, but `getAge` uses local-time methods (`getMonth()`, `getDate()`). Users born on boundary dates can be mis-aged by a year in negative-UTC timezones.

## 🟡 Medium

- [ ] **M1** `src/routes/v1/auth/ask-pwd-reset.ts:52-53` — Reset token transported in URL query param (`{siteUrl}/reset-password?token=...`). Query params leak via Referer headers, server logs, browser history. Document the risk and recommend a POST-to-page pattern.
- [ ] **M2** `src/routes/v1/auth/ask-pwd-reset.ts:44` — Unsafe cast `request.body as askPwdResetBody` instead of using generic type parameter `FastifyRequest<{ Body: AskPwdResetBody }>`.
- [ ] **M3** `src/types/plugin-options.ts` — All 9 callbacks are required even if consumer only uses a subset of routes (e.g. login/logout without password reset requires implementing `sendResetEmail`). Consider making per-route callbacks optional.
- [ ] **M4** `package.json` (dependencies) — `eslint-plugin-import-x` listed in runtime `dependencies` instead of `devDependencies`. It is a linting tool, not a runtime dep.
- [ ] **M5** `src/routes/v1/auth/ask-pwd-reset.ts:12,16` — Type naming clash: const `askPwdResetBody` (camelCase) shadows type `askPwdResetBody` (same name). Rename type to PascalCase `AskPwdResetBody`.
- [ ] **M6** `src/routes/v1/auth/signup.ts:63,72` + `pwd-reset.ts:70,76,84,88` — Plain-string responses for both success and error. Consumers must `===`-compare strings to determine results. Convert to JSON.
- [ ] **M7** `src/routes/v1/auth/login.ts:74` + `refresh.ts:44` — Dead branches: JWT `decode()` returning `null` immediately after a successful `sign()` is effectively impossible. Remove dead code and add a `!` assertion, or test it.

## 🔵 Low

- [ ] **L1** `src/routes/v1/auth/pwd-reset.ts:66` — `let user` should be `const`. Variable is assigned once in try block and never reassigned.
- [ ] **L2** `src/routes/v1/auth/signup.ts:70` — `let errorMessage` with subsequent `??=` can be replaced by `const errorMessage = (await ...) ?? '...'`.
- [ ] **L3** `src/routes/v1/auth/signup.ts:51` + `pwd-reset.ts:56` — Typo: "sucessfully" → "successfully" in TSDoc examples.
- [ ] **L4** `src/routes/v1/auth/logout.ts:29` — Dead option: `{ config: { rawBody: false } }` on PATCH route appears unnecessary.
- [ ] **L5** `src/types/plugin-options.ts:36` — Unused side-effect import: `import '@fastify/cookie'` — the file doesn't use any types from this package.
- [ ] **L6** `tests/routes/v1/auth/askPwdReset.test.ts:5-8` — Unused `passwordHash` computed in `beforeAll` but never used in any test.
- [ ] **L7** `tests/routes/v1/auth/login.test.ts` — Cookie attributes (`HttpOnly`, `Secure`, `SameSite`, `Path`) never asserted in any test.
- [ ] **L8** `tests/` — Missing full-flow integration test: signup → login → refresh → is-logged-in → logout → refresh-rejected.
- [ ] **L9** `src/types/fastify.d.ts:14,117,140` — `JwtVerifyOptions` with `onlyCookie` exposed on `accessJwtVerify` and `resetJwtVerify` where the option is meaningless (only refresh uses cookies).
- [ ] **L10** `tests/routes/v1/auth/login.test.ts:36` — Test checks `set-cookie` exists but doesn't assert specific cookie attributes.
- [ ] **L11** `tests/routes/v1/auth/refresh.test.ts` — Token rotation not tested: no assertion that old refresh token is revoked or that a new cookie is set.
