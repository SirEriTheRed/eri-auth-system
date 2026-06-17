import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PREFIX, buildApp, signAccessToken } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`GET ${ROUTE_PREFIX}/is-logged-in`, () => {
  it('returns 200 with the user payload on a valid access token', async () => {
    const { app } = await buildApp();
    const token = await signAccessToken(app);

    const response = await app.inject({
      method: 'GET',
      url: `${ROUTE_PREFIX}/is-logged-in`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ userId: 'user-1' });
  });

  it('returns 401 when the access token is invalid', async () => {
    const { app } = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: `${ROUTE_PREFIX}/is-logged-in`,
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Access token invalid, please refresh the token',
    });
  });

  it('returns 401 when no authorization header is sent', async () => {
    const { app } = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: `${ROUTE_PREFIX}/is-logged-in`,
    });

    expect(response.statusCode).toBe(401);
  });
});
