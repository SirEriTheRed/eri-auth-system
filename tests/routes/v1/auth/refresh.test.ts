import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PREFIX, buildApp, signRefreshToken } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`POST ${ROUTE_PREFIX}/refresh`, () => {
  it('returns 200 with a new accessToken when the refresh cookie is valid', async () => {
    const { app } = await buildApp();
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/refresh`,
      cookies: { refreshToken: token },
      headers: { origin: 'http://localhost' },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
  });

  it('returns 401 when no refresh cookie is sent', async () => {
    const { app } = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/refresh`,
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Refresh token invalid, please log in',
    });
  });

  it('returns 401 when the refresh token is revoked', async () => {
    const { app, mocks } = await buildApp();
    mocks.getTokenRevokedAt.mockResolvedValue(new Date());
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/refresh`,
      cookies: { refreshToken: token },
      headers: { origin: 'http://localhost' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns 403 when the origin is not allowed', async () => {
    const { app } = await buildApp();
    const token = await signRefreshToken(app);

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/refresh`,
      cookies: { refreshToken: token },
      headers: { origin: 'https://evil.com' },
    });

    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Cross-origin request forbidden',
    });
  });
});
