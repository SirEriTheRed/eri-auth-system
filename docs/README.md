**@EriTheRed/eri-auth-system**

---

# @EriTheRed/eri-auth-system

# `@EriTheRed/eri-auth-system`

A Fastify plugin that adds JWT-based authentication with **access**, **refresh**,
and **password-reset** token namespaces, automatic cookie handling, and six
pre-built auth routes under the `/v1/auth` prefix.

## Quick start

```typescript
import fastify from 'fastify';
import { authPlugin } from '@EriTheRed/eri-auth-system';

const app = fastify();

await app.register(authPlugin, {
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  resetSecret: process.env.JWT_RESET_SECRET!,
  siteUrl: 'https://example.com',
  // ... all PluginOptions callbacks
});

await app.listen({ port: 3000 });
```

## See

- [PluginOptions](interfaces/PluginOptions.md) for the full configuration reference
- [authPlugin](variables/authPlugin.md) for the exported plugin

## Interfaces

- [PluginOptions](interfaces/PluginOptions.md)

## Variables

- [authPlugin](variables/authPlugin.md)
