import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PREFIX, buildApp, signResetToken } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe(`PATCH ${ROUTE_PREFIX}/pwdReset`, () => {
  it('returns 201 on a successful password reset', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: `${ROUTE_PREFIX}/pwdReset`,
      payload: {
        token,
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({ message: 'Password reset successfully' });
    expect(mocks.updateUserPassword).toHaveBeenCalledWith('user-1', expect.any(String));
    expect(mocks.logoutAllDevices).toHaveBeenCalledWith('user-1');
  });

  it('returns 401 when the reset token is invalid', async () => {
    const { app, mocks } = await buildApp();

    const response = await app.inject({
      method: 'PATCH',
      url: `${ROUTE_PREFIX}/pwdReset`,
      payload: {
        token: 'invalid-token',
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'This link is invalid',
    });
    expect(mocks.updateUserPassword).not.toHaveBeenCalled();
  });

  it('returns 400 when passwords do not match', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);

    const response = await app.inject({
      method: 'PATCH',
      url: `${ROUTE_PREFIX}/pwdReset`,
      payload: {
        token,
        password: 'password-one',
        passwordConfirm: 'password-two',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Passwords do not match',
    });
    expect(mocks.updateUserPassword).not.toHaveBeenCalled();
  });

  it('returns 500 when the password update fails', async () => {
    const { app, mocks } = await buildApp();
    const token = await signResetToken(app);
    mocks.updateUserPassword.mockRejectedValue(new Error('db error'));

    const response = await app.inject({
      method: 'PATCH',
      url: `${ROUTE_PREFIX}/pwdReset`,
      payload: {
        token,
        password: 'new-password-ok',
        passwordConfirm: 'new-password-ok',
      },
    });

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Unknown error during password reset',
    });
  });
});
