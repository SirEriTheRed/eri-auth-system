# [3.1.0](https://github.com/SirEriTheRed/eri-auth-system/compare/v3.0.0...v3.1.0) (2026-06-25)

### Bug Fixes

- **ask-pwd-reset:** return 200 for unknown users to prevent enumeration ([7046956](https://github.com/SirEriTheRed/eri-auth-system/commit/7046956dc10ea3e79c0543c5ee2758dde38fa219))
- **auth:** fix typos in signup and password reset messages ([e24e7ea](https://github.com/SirEriTheRed/eri-auth-system/commit/e24e7eacb2d4e0bc3253ac3a116bd0126988d3aa))
- **login:** remove hardcoded domain localhost from cookie ([c60c6dc](https://github.com/SirEriTheRed/eri-auth-system/commit/c60c6dc98a6fb26b7673ceebc57fbb5c074100d9))
- **login:** remove stray console.log in catch block ([b34cfaa](https://github.com/SirEriTheRed/eri-auth-system/commit/b34cfaace76fcde35b7e155e191192c1eff8d54d))
- **logout:** prevent stack trace exposure in error response ([fae5642](https://github.com/SirEriTheRed/eri-auth-system/commit/fae5642f65b480aaa871ee867e758c25b3a57c78))
- **plugin:** add missing getTokenRevokedAt decorator on fastify instance ([11a30be](https://github.com/SirEriTheRed/eri-auth-system/commit/11a30bedae3b17c7cea46209ac1e4ea885a9a7fd))
- **plugin:** use opts.siteUrl instead of fastify.siteUrl in decorate ([b4d2c8d](https://github.com/SirEriTheRed/eri-auth-system/commit/b4d2c8dc9be25d2da732ed524ed8fbcd4e06c092))

### Features

- **refresh:** implement refresh token rotation ([dfa6b97](https://github.com/SirEriTheRed/eri-auth-system/commit/dfa6b97a1838f2921cbce875d330f54d45a11183))

# [3.0.0](https://github.com/SirEriTheRed/eri-auth-system/compare/v2.0.0...v3.0.0) (2026-06-17)

### Features

- **plugin:** add configurable route prefix option with /auth default ([bde571e](https://github.com/SirEriTheRed/eri-auth-system/commit/bde571e8d91af031c4c8ac6a1d5de7dd70582a56))
- **signup:** make minimumAge optional with direct 403 response ([0030fef](https://github.com/SirEriTheRed/eri-auth-system/commit/0030fefc7cc38c514124ea21d6cf29c05f9bdd7b))

### BREAKING CHANGES

- **plugin:** the default route prefix changed from /v1/auth to /auth.
  Consumers can pass prefix: '/v1/auth' to restore the old behaviour.

# [2.0.0](https://github.com/SirEriTheRed/eri-auth-system/compare/v1.0.0...v2.0.0) (2026-06-16)

### Bug Fixes

- **auth:** correct age validation and add test coverage ([d53a047](https://github.com/SirEriTheRed/eri-auth-system/commit/d53a047190e43a7232e133529c860094796375b2))

### Features

- **auth:** add minimumAge option for age validation during signup ([e21ff18](https://github.com/SirEriTheRed/eri-auth-system/commit/e21ff18a4da59aab942d8eb339179d1a2770301e))

### BREAKING CHANGES

- **auth:** `minimumAge` is now a required property in PluginOptions.

# 1.0.0 (2026-06-16)

### Bug Fixes

- correct repository URLs to SirEriTheRed ([b803e6e](https://github.com/SirEriTheRed/eri-auth-system/commit/b803e6e0f0bcdf3758f0f4605810400b60563194))
- fixed husky pre-push ([59f42a5](https://github.com/SirEriTheRed/eri-auth-system/commit/59f42a5a3e97fef1a86c53850e85d0bee8541146))

### Features

- add is-logged-in route, pre-release tooling, and fix package config ([f674b59](https://github.com/SirEriTheRed/eri-auth-system/commit/f674b5944026e02b053dbb8ed8f77535d914f1be))
- add PluginOptions validation and finalize pre-release setup ([6d012c7](https://github.com/SirEriTheRed/eri-auth-system/commit/6d012c7347ab363867fd91c257deb6f4bbb5d7d4))
- added minimum age option and check ([2227991](https://github.com/SirEriTheRed/eri-auth-system/commit/222799130ec7c8f269f0f0be30c68d9fab36a79b))

# 1.0.0 (2026-06-16)

### Bug Fixes

- correct repository URLs to SirEriTheRed ([b803e6e](https://github.com/SirEriTheRed/eri-auth-system/commit/b803e6e0f0bcdf3758f0f4605810400b60563194))
- fixed husky pre-push ([59f42a5](https://github.com/SirEriTheRed/eri-auth-system/commit/59f42a5a3e97fef1a86c53850e85d0bee8541146))

### Features

- add is-logged-in route, pre-release tooling, and fix package config ([f674b59](https://github.com/SirEriTheRed/eri-auth-system/commit/f674b5944026e02b053dbb8ed8f77535d914f1be))
- add PluginOptions validation and finalize pre-release setup ([6d012c7](https://github.com/SirEriTheRed/eri-auth-system/commit/6d012c7347ab363867fd91c257deb6f4bbb5d7d4))

# 1.0.0 (2026-06-16)

### Bug Fixes

- correct repository URLs to SirEriTheRed ([b803e6e](https://github.com/SirEriTheRed/eri-auth-system/commit/b803e6e0f0bcdf3758f0f4605810400b60563194))
- fixed husky pre-push ([59f42a5](https://github.com/SirEriTheRed/eri-auth-system/commit/59f42a5a3e97fef1a86c53850e85d0bee8541146))

### Features

- add is-logged-in route, pre-release tooling, and fix package config ([f674b59](https://github.com/SirEriTheRed/eri-auth-system/commit/f674b5944026e02b053dbb8ed8f77535d914f1be))
- add PluginOptions validation and finalize pre-release setup ([6d012c7](https://github.com/SirEriTheRed/eri-auth-system/commit/6d012c7347ab363867fd91c257deb6f4bbb5d7d4))

# 1.0.0 (2026-06-16)

### Bug Fixes

- correct repository URLs to SirEriTheRed ([b803e6e](https://github.com/SirEriTheRed/eri-auth-system/commit/b803e6e0f0bcdf3758f0f4605810400b60563194))
- fixed husky pre-push ([59f42a5](https://github.com/SirEriTheRed/eri-auth-system/commit/59f42a5a3e97fef1a86c53850e85d0bee8541146))

### Features

- add is-logged-in route, pre-release tooling, and fix package config ([f674b59](https://github.com/SirEriTheRed/eri-auth-system/commit/f674b5944026e02b053dbb8ed8f77535d914f1be))
- add PluginOptions validation and finalize pre-release setup ([6d012c7](https://github.com/SirEriTheRed/eri-auth-system/commit/6d012c7347ab363867fd91c257deb6f4bbb5d7d4))
