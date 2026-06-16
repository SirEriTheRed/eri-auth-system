import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp, signRefreshToken } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PATCH /v1/auth/logout', () => {
  it('returns 200 and revokes the token on a valid refresh cookie', async () => {
    const { app, mocks } = await buildApp();
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/logout',
      cookies: { refreshToken: token },
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.revokeToken).toHaveBeenCalledWith(token);
  });

  it('returns 401 when no refresh cookie is sent', async () => {
    const { app, mocks } = await buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/logout',
    });

    expect(response.statusCode).toBe(401);
    expect(mocks.revokeToken).not.toHaveBeenCalled();
  });

  it('returns 401 when the refresh token is revoked', async () => {
    const { app, mocks } = await buildApp();
    mocks.getTokenRevokedAt.mockResolvedValue(new Date());
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/logout',
      cookies: { refreshToken: token },
    });

    expect(response.statusCode).toBe(401);
    expect(mocks.revokeToken).not.toHaveBeenCalled();
  });

  it('returns 401 when the getTokenRevokedAt callback throws', async () => {
    const { app, mocks } = await buildApp();
    mocks.getTokenRevokedAt.mockRejectedValue(new Error('db error'));
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/logout',
      cookies: { refreshToken: token },
    });

    expect(response.statusCode).toBe(401);
    expect(mocks.revokeToken).not.toHaveBeenCalled();
  });
});
