/* eslint-disable @typescript-eslint/no-unused-vars */
import type { VerifyOptions, JWT } from '@fastify/jwt';
import type { FastifyRequest, FastifyReply } from 'fastify';

import type { PluginOptions } from './plugin-options.js';

type JwtVerifyOptions = Partial<VerifyOptions> & { onlyCookie?: boolean };

declare module '@fastify/jwt' {
  interface JWT {
    access: JWT;
    refresh: JWT;
    reset: JWT;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    // Décorateurs scalaires
    siteUrl: string;

    // Décorateurs authenticate
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    // Fonctions injectées via PluginOptions
    findUser: PluginOptions['findUser'];
    createUser: PluginOptions['createUser'];
    revokeToken: PluginOptions['revokeToken'];
    sendResetEmail: PluginOptions['sendResetEmail'];
    createRefreshToken: PluginOptions['createRefreshToken'];
    updateUserPassword: PluginOptions['updateUserPassword'];
    logoutAllDevices: PluginOptions['logoutAllDevices'];
    analyseError: PluginOptions['analyseError'];
  }

  interface FastifyRequest {
    accessJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    refreshJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    resetJwtVerify: (options?: JwtVerifyOptions) => Promise<void>;
    accessUser: { userId: string };
    refreshUser: { userId: string };
  }

  interface FastifyReply {
    accessJwtSign: (payload: { userId: string }) => Promise<string>;
    refreshJwtSign: (payload: { userId: string }) => Promise<string>;
    resetJwtSign: (payload: { userId: string }) => Promise<string>;
  }
}
