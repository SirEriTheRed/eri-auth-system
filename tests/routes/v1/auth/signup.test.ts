import { buildApp } from '../../../helpers.js';

afterEach(() => {
  vi.restoreAllMocks();
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
