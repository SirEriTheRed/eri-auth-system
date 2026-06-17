# eri-auth-system — agent guide

## Commands

| Command                    | Action                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`            | `tsc` — compiles `src/` → `dist/`                                                                                                                                 |
| `npm run dev`              | `tsc --watch`                                                                                                                                                     |
| `npm run type-check`       | `tsc --noEmit` (source only)                                                                                                                                      |
| `npm run type-check:tests` | `tsc --noEmit -p tsconfig.test.json` (source + tests)                                                                                                             |
| `npm run lint`             | `eslint .` (flat config, strict type-checked)                                                                                                                     |
| `npm run lint:fix`         | `eslint . --fix`                                                                                                                                                  |
| `npm run format`           | `prettier --write .`                                                                                                                                              |
| `npm run format:check`     | `prettier --check .`                                                                                                                                              |
| `npm test`                 | Runs `vitest run --coverage` — 39 integration tests covering all 7 routes + authenticate decorator. Coverage thresholds: 80% lines/functions/branches/statements. |
| `npx knip`                 | dead-code analysis                                                                                                                                                |

## Workflow

- **Pre-commit** (husky + lint-staged): `eslint --fix` + `prettier --write` on staged `*.{js,ts}`, then `npm run type-check` if any `.ts` files are staged.
- **Commit messages**: conventional commits enforced via commitlint (`@commitlint/config-conventional`).
- **Recommended local order**: `npm run lint` → `npm run type-check` → `npm run format:check` → tests.

## Architecture

- **Single-package ESM repo** — publishes a `fastify-plugin` (`authPlugin` from `src/index.ts`).
- **Entrypoint**: `src/index.ts` — decorates fastify with callbacks from `PluginOptions`, registers `@fastify/cookie`, `@fastify/jwt` (3 namespaces: access/refresh/reset), and 7 routes under the configured prefix (default `/auth`).
- **Dependency injection**: no ORM/framework — consumer provides callbacks (`findUser`, `createUser`, `revokeToken`, `sendResetEmail`, `createRefreshToken`, `updateUserPassword`, `logoutAllDevices`, `analyseError`, `getTokenRevokedAt`).
- **Type augmentation**: `src/types/fastify.d.ts` augments `@fastify/jwt` and `fastify` modules.

## Orphaned / stale

- `src/routes/v1/auth/test-login.ts` — exists but **not imported** in `src/index.ts`.
- `dist/` is stale (out of sync with `src/`). Run `npm run build` to regenerate.

## Style conventions

- **Filenames**: kebab-case enforced by `unicorn/filename-case` (e.g. `ask-pwd-reset.ts`).
- **No default exports**: `import/no-default-export: error`.
- **Type imports**: `@typescript-eslint/consistent-type-imports` with `prefer: "type-imports"`.
- **Imports order**: builtin → external → internal → parent → sibling → index, grouped with newlines, alphabetized.
- **Prettier**: semi, singleQuote, tabWidth 2, trailingComma es5, printWidth 100.

## tsconfig quirks

- `verbatimModuleSyntax: true` — must use `import type` for type-only imports, and `.js` extensions in relative imports.
- `skipLibCheck: false` — all `.d.ts` in node_modules are checked.
- `exactOptionalPropertyTypes: true` — cannot assign `undefined` to optional properties.
- `noUncheckedIndexedAccess: true` — indexed access returns `T | undefined`.
- Test files excluded from main `tsconfig.json` — use `tsconfig.test.json` for test type-checking (`npm run type-check:tests`).
- `tsconfig.test.json` adds `vitest/globals` types and disables unused-variable errors for test convenience.

## Testing

- **Vitest** with `globals: true` (describe/it/expect available without import).
- Coverage thresholds: 80% lines/functions/branches/statements.
- Integration tests: `tests/` directory mirrors `src/routes/` structure — 9 test files covering all 7 routes + authenticate decorator + plugin-options validation.
- Run: `npm test` or `npx vitest run`.
