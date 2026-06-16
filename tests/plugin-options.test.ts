import Fastify from 'fastify';

import { authPlugin } from '../src/index.js';

describe('PluginOptions validation', () => {
  const validOpts = {
    accessSecret: 'test-access-secret-012345678901234',
    refreshSecret: 'test-refresh-secret-0123456789012',
    resetSecret: 'test-reset-secret-012345678901234',
    siteUrl: 'http://localhost',
    findUser: vi.fn(),
    createUser: vi.fn(),
    revokeToken: vi.fn(),
    createRefreshToken: vi.fn(),
    sendResetEmail: vi.fn(),
    updateUserPassword: vi.fn(),
    logoutAllDevices: vi.fn(),
    analyseError: vi.fn().mockResolvedValue(null),
    getTokenRevokedAt: vi.fn().mockResolvedValue(null),
  };

  async function expectMissingField(field: string, partialOpts: any) {
    const app = Fastify();
    app.register(authPlugin, partialOpts);
    await expect(app.ready()).rejects.toThrow(
      `[eri-auth-system] Missing required option: ${field}`
    );
  }

  const requiredStrings = ['accessSecret', 'refreshSecret', 'resetSecret', 'siteUrl'] as const;
  const requiredFunctions = [
    'findUser',
    'createUser',
    'revokeToken',
    'sendResetEmail',
    'createRefreshToken',
    'updateUserPassword',
    'logoutAllDevices',
    'analyseError',
    'getTokenRevokedAt',
  ] as const;

  describe('throws when a string option is missing', () => {
    for (const field of requiredStrings) {
      it(field, async () => {
        const { [field]: _, ...rest } = validOpts;
        await expectMissingField(field, rest);
      });
    }
  });

  describe('throws when a function option is missing', () => {
    for (const field of requiredFunctions) {
      it(field, async () => {
        const { [field]: _, ...rest } = validOpts;
        await expectMissingField(field, rest);
      });
    }
  });
});
