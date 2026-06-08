import '@fastify/cookie';

export interface PluginOptions {
  accessSecret: string;
  refreshSecret: string;
  resetSecret: string;
  siteUrl: string;
  sendResetEmail: (to: string, reserLink: string) => Promise<void>;
  createRefreshToken: (userId: string, token: string, expiredAt: Date) => Promise<void>;
  findUser: (
    userId: string
  ) => Promise<{ id: string; hashedPassword: string; email: string } | null>;
  revokeToken: (refeshToken: string | undefined) => Promise<void>;
  updateUserPassword: (userId: string, hashedPassword: string) => Promise<void>;
  logoutAllDevices: (userId: string) => Promise<void>;
  createUser: (userId: string, email: string, birthday: string) => Promise<void>;
  analyseError: (error: unknown) => Promise<string | null>;
  getTokenRevokedAt: (refeshToken: string) => Promise<Date | null>;
}
