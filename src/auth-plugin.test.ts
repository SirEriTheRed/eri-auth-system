import { hash } from 'argon2';
import Fastify from 'fastify';

import { authPlugin } from './index.js';

async function buildApp(setup?: (app: ReturnType<typeof Fastify>) => void) {
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

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await hash('correct-password');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /v1/auth/login', () => {
  it('returns 200 with an accessToken on valid credentials', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockResolvedValue({
      id: 'user-1',
      hashedPassword: passwordHash,
      email: 'user@test.com',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { id: 'user-1', password: 'correct-password' },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toHaveProperty('accessToken');
    expect(typeof JSON.parse(response.body).accessToken).toBe('string');
    expect(mocks.createRefreshToken).toHaveBeenCalledOnce();
    expect(mocks.findUser).toHaveBeenCalledWith('user-1');
  });

  it('returns 404 when the user is not found', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { id: 'unknown', password: 'any' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toBe('Could not find an user with this id');
  });

  it('returns 401 when the password is invalid', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockResolvedValue({
      id: 'user-1',
      hashedPassword: passwordHash,
      email: 'user@test.com',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { id: 'user-1', password: 'wrong-password' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toBe('This password is invalid');
  });

  it('returns 401 with a default message for unknown errors', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockRejectedValue(new Error('db connection failed'));

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { id: 'user-1', password: 'any' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toBe('Unknown error during login');
  });
});

describe('PATCH /v1/auth/logout', () => {
  async function signRefreshToken(app: ReturnType<typeof Fastify>) {
    return app.jwt.refresh.sign({ userId: 'user-1' });
  }

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

describe('POST /v1/auth/signup', () => {
  it('returns 201 on successful user creation', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        id: 'new-user',
        email: 'new@test.com',
        birthday: '2000-01-01',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBe('User created sucessfully');
    expect(mocks.createUser).toHaveBeenCalledWith('new-user', 'new@test.com', '2000-01-01');
  });

  it('returns 500 when createUser throws and analyseError returns null', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockRejectedValue(new Error('db error'));

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        id: 'new-user',
        email: 'new@test.com',
        birthday: '2000-01-01',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('Unknown error during signup');
  });

  it('returns custom message when analyseError returns one', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockRejectedValue(new Error('duplicate'));
    mocks.analyseError.mockResolvedValue('This user ID is already taken');

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/signup',
      payload: {
        id: 'existing-user',
        email: 'existing@test.com',
        birthday: '1990-05-20',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('This user ID is already taken');
  });
});

describe('GET /v1/auth/refresh', () => {
  async function signRefreshToken(app: ReturnType<typeof Fastify>) {
    return app.jwt.refresh.sign({ userId: 'user-1' });
  }

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

describe('POST /v1/auth/askPwdReset', () => {
  it('sends a reset email when the user exists', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockResolvedValue({
      id: 'user-1',
      hashedPassword: passwordHash,
      email: 'user@test.com',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/askPwdReset',
      payload: { userId: 'user-1' },
    });

    expect(response.statusCode).toBe(200);
    expect(mocks.findUser).toHaveBeenCalledWith('user-1');
    expect(mocks.sendResetEmail).toHaveBeenCalledOnce();
    const [to, resetLink] = mocks.sendResetEmail.mock.calls[0] as [string, string];
    expect(to).toBe('user@test.com');
    expect(resetLink).toContain('/reset-password?token=');
  });

  it('throws an error when the user is not found', async () => {
    const { app, mocks } = await buildApp();
    mocks.findUser.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/askPwdReset',
      payload: { userId: 'unknown' },
    });

    expect(response.statusCode).toBe(500);
    expect(mocks.sendResetEmail).not.toHaveBeenCalled();
  });
});

describe('PATCH /v1/auth/pwdReset', () => {
  async function signResetToken(app: ReturnType<typeof Fastify>) {
    return app.jwt.reset.sign({ userId: 'user-1' });
  }

  it('returns 201 on a successful password reset', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/pwdReset',
      payload: {
        token,
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toBe('Password reset sucessfully');
    expect(mocks.updateUserPassword).toHaveBeenCalledWith('user-1', expect.any(String));
    expect(mocks.logoutAllDevices).toHaveBeenCalledWith('user-1');
  });

  it('returns 401 when the reset token is invalid', async () => {
    const { app, mocks } = await buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/pwdReset',
      payload: {
        token: 'invalid-token',
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toBe('This link is invalid link');
    expect(mocks.updateUserPassword).not.toHaveBeenCalled();
  });

  it('returns 400 when passwords do not match', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/pwdReset',
      payload: {
        token,
        password: 'password-one',
        passwordConfirm: 'password-two',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe('Passwords do not match');
    expect(mocks.updateUserPassword).not.toHaveBeenCalled();
  });

  it('returns 500 when the password update fails', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);
    mocks.updateUserPassword.mockRejectedValue(new Error('db error'));

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/pwdReset',
      payload: {
        token,
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toBe('Unknown error during password reset');
  });
});

describe('GET /v1/auth/is-logged-in', () => {
  async function signAccessToken(app: ReturnType<typeof Fastify>) {
    return app.jwt.access.sign({ userId: 'user-1' });
  }

  it('returns 200 with the user payload on a valid access token', async () => {
    const { app } = await buildApp();
    const token = await signAccessToken(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/is-logged-in',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ userId: 'user-1' });
  });

  it('returns 401 when the access token is invalid', async () => {
    const { app } = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/v1/auth/is-logged-in',
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
      url: '/v1/auth/is-logged-in',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('authenticate decorator', () => {
  async function signAccessToken(app: ReturnType<typeof Fastify>) {
    return app.jwt.access.sign({ userId: 'user-1' });
  }

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

  async function expectMissingField(field: string, partialOpts: object) {
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
