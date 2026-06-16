import { buildApp, getPasswordHash } from '../../../helpers.js';

let passwordHash: string;

beforeAll(async () => {
  passwordHash = await getPasswordHash();
});

afterEach(() => {
  vi.restoreAllMocks();
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
