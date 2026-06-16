import { buildApp, signAccessToken } from '../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authenticate decorator', () => {
  it('allows requests with a valid access token', async () => {
    const { app } = await buildApp((a) => {
      a.get('/test-auth', { onRequest: a.authenticate }, async () => ({ ok: true }));
    });

    const token = await signAccessToken(app);
    const response = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
  });

  it('rejects requests with an invalid access token', async () => {
    const { app } = await buildApp((a) => {
      a.get('/test-auth', { onRequest: a.authenticate }, async () => ({ ok: true }));
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-auth',
      headers: { authorization: 'Bearer invalid-token' },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Access token invalid, please refresh the token',
    });
  });

  it('rejects requests with no authorization header', async () => {
    const { app } = await buildApp((a) => {
      a.get('/test-auth', { onRequest: a.authenticate }, async () => ({ ok: true }));
    });

    const response = await app.inject({
      method: 'GET',
      url: '/test-auth',
    });

    expect(response.statusCode).toBe(401);
  });
});
