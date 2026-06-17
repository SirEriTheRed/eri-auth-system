import { hash } from 'argon2';
import Fastify from 'fastify';

import { DEFAULT_ROUTE_PREFIX, authPlugin } from '../src/index.js';

export const ROUTE_PREFIX = DEFAULT_ROUTE_PREFIX;

let cachedPasswordHash: string;

export async function getPasswordHash(): Promise<string> {
  if (!cachedPasswordHash) {
    cachedPasswordHash = await hash('correct-password');
  }
  return cachedPasswordHash;
}

export async function buildApp(
  setup?: (app: ReturnType<typeof Fastify>) => void,
  overrides?: { minimumAge?: number; prefix?: string }
) {
  const findUser = vi.fn();
  const createUser = vi.fn();
  const revokeToken = vi.fn();
  const createRefreshToken = vi.fn();
  const sendResetEmail = vi.fn();
  const updateUserPassword = vi.fn();
  const logoutAllDevices = vi.fn();
  const analyseError = vi.fn().mockResolvedValue(null);
  const getTokenRevokedAt = vi.fn().mockResolvedValue(null);

  const app = Fastify();

  await app.register(authPlugin, {
    accessSecret: 'test-access-secret-012345678901234',
    refreshSecret: 'test-refresh-secret-0123456789012',
    resetSecret: 'test-reset-secret-012345678901234',
    siteUrl: 'http://localhost',
    minimumAge: overrides?.minimumAge ?? 0,
    ...(overrides?.prefix !== undefined ? { prefix: overrides.prefix } : {}),
    findUser,
    createUser,
    revokeToken,
    createRefreshToken,
    sendResetEmail,
    updateUserPassword,
    logoutAllDevices,
    analyseError,
    getTokenRevokedAt,
  });

  if (setup) {
    setup(app);
  }

  await app.ready();

  return {
    app,
    mocks: {
      findUser,
      createUser,
      revokeToken,
      createRefreshToken,
      sendResetEmail,
      updateUserPassword,
      logoutAllDevices,
      analyseError,
      getTokenRevokedAt,
    },
  };
}

export function signRefreshToken(app: ReturnType<typeof Fastify>) {
  return app.jwt.refresh.sign({ userId: 'user-1' });
}

export function signAccessToken(app: ReturnType<typeof Fastify>) {
  return app.jwt.access.sign({ userId: 'user-1' });
}

export function signResetToken(app: ReturnType<typeof Fastify>) {
  return app.jwt.reset.sign({ userId: 'user-1' });
}
