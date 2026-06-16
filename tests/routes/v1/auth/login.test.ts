import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { buildApp, getPasswordHash } from '../../../helpers.js';

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await getPasswordHash();
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
