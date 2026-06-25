import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PREFIX, buildApp } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`POST ${ROUTE_PREFIX}/signup`, () => {
  it('returns 201 on successful user creation', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockResolvedValue(undefined);

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/signup`,
      payload: {
        id: 'new-user',
        email: 'new@test.com',
        birthday: '2000-01-01',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({ message: 'User created successfully' });
    expect(mocks.createUser).toHaveBeenCalledWith('new-user', 'new@test.com', '2000-01-01');
  });

  it('returns 500 when createUser throws and analyseError returns null', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockRejectedValue(new Error('db error'));

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/signup`,
      payload: {
        id: 'new-user',
        email: 'new@test.com',
        birthday: '2000-01-01',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Unknown error during signup',
    });
  });

  it('returns custom message when analyseError returns one', async () => {
    const { app, mocks } = await buildApp();
    mocks.createUser.mockRejectedValue(new Error('duplicate'));
    mocks.analyseError.mockResolvedValue({
      message: 'This user ID is already taken',
      statusCode: 409,
    });

    const response = await app.inject({
      method: 'POST',
      url: `${ROUTE_PREFIX}/signup`,
      payload: {
        id: 'existing-user',
        email: 'existing@test.com',
        birthday: '1990-05-20',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 409,
      error: 'Conflict',
      message: 'This user ID is already taken',
    });
  });

  describe('age validation', () => {
    it('returns 403 when the user is underaged', async () => {
      const { app, mocks } = await buildApp(undefined, { minimumAge: 18 });

      const response = await app.inject({
        method: 'POST',
        url: `${ROUTE_PREFIX}/signup`,
        payload: {
          id: 'underage',
          email: 'underage@test.com',
          birthday: `${new Date().getFullYear() - 16}-01-01`,
        },
      });

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toEqual({
        statusCode: 403,
        error: 'Forbidden',
        message: 'User does not meet the minimum age requirement',
      });
      expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it('allows signup when age is at minimumAge threshold', async () => {
      const { app, mocks } = await buildApp(undefined, { minimumAge: 18 });

      const response = await app.inject({
        method: 'POST',
        url: `${ROUTE_PREFIX}/signup`,
        payload: {
          id: 'at-threshold',
          email: 'threshold@test.com',
          birthday: (() => {
            const today = new Date();
            return `${today.getFullYear() - 18}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          })(),
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mocks.createUser).toHaveBeenCalledWith(
        'at-threshold',
        'threshold@test.com',
        expect.any(String)
      );
    });

    it('allows signup when user is well above minimumAge', async () => {
      const { app, mocks } = await buildApp(undefined, { minimumAge: 18 });

      const today = new Date();
      const birthday = `${today.getFullYear() - 30}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const response = await app.inject({
        method: 'POST',
        url: `${ROUTE_PREFIX}/signup`,
        payload: {
          id: 'old-enough',
          email: 'old@test.com',
          birthday,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mocks.createUser).toHaveBeenCalled();
    });

    it('allows signup when minimumAge is not configured', async () => {
      const { app, mocks } = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: `${ROUTE_PREFIX}/signup`,
        payload: {
          id: 'no-min-age',
          email: 'young@test.com',
          birthday: `${new Date().getFullYear() - 10}-01-01`,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mocks.createUser).toHaveBeenCalledWith(
        'no-min-age',
        'young@test.com',
        expect.any(String)
      );
    });
  });
});
