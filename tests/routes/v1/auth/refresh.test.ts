import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp, signRefreshToken } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /v1/auth/refresh', () => {
  it('returns 200 with a new accessToken when the refresh cookie is valid', async () => {
    const { app } = await buildApp();
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/refresh',
      cookies: { refreshToken: token },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
  });

  it('returns 401 when no refresh cookie is sent', async () => {
    const { app } = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/refresh',
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Refresh token invalid, please log in',
    });
  });

  it('returns 401 when the refresh token is revoked', async () => {
    const { app, mocks } = await buildApp();
    mocks.getTokenRevokedAt.mockResolvedValue(new Date());
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/refresh',
      cookies: { refreshToken: token },
    });

    expect(response.statusCode).toBe(401);
  });
});
