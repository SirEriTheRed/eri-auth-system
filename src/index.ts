import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import type { FastifyPluginCallback, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { authenticate } from './plugins/authenticate.js';
import { askPwdResetRoute } from './routes/v1/auth/ask-pwd-reset.js';
import { loginRoute } from './routes/v1/auth/login.js';
import { logoutRoute } from './routes/v1/auth/logout.js';
import { pwdResetRoute } from './routes/v1/auth/pwd-reset.js';
import { refreshRoute } from './routes/v1/auth/refresh.js';
import { signupRoute } from './routes/v1/auth/signup.js';
import type { PluginOptions } from './types/plugin-options.js';

const auth: FastifyPluginCallback<PluginOptions> = (fastify, opts) => {
  // Décorateurs scalaires + fonctions issues des opts
  fastify.decorate('siteUrl', fastify.siteUrl);
  fastify.decorate('findUser', opts.findUser);
  fastify.decorate('createUser', opts.createUser);
  fastify.decorate('revokeToken', opts.revokeToken);
  fastify.decorate('sendResetEmail', opts.sendResetEmail);
  fastify.decorate('createRefreshToken', opts.createRefreshToken);
  fastify.decorate('updateUserPassword', opts.updateUserPassword);
  fastify.decorate('logoutAllDevices', opts.logoutAllDevices);
  fastify.decorate('analyseError', opts.analyseError);

  // Plugins tiers — pas de await
  fastify.register(fastifyCookie);

  fastify.register(fastifyJwt, {
    namespace: 'access',
    secret: opts.accessSecret,
    sign: { expiresIn: '15m' },
  });

  fastify.register(fastifyJwt, {
    namespace: 'refresh',
    decoratorName: 'refreshUser',
    secret: opts.refreshSecret,
    sign: { expiresIn: '7d' },
    trusted: async (request: FastifyRequest) => {
      const token = request.cookies.refreshToken;
      if (!token || typeof token !== 'string') return false;
      try {
        const revokedAt = await opts.getTokenRevokedAt(token);
        return revokedAt === null;
      } catch {
        return false;
      }
    },
    cookie: { cookieName: 'refreshToken', signed: false },
  });

  fastify.register(fastifyJwt, {
    namespace: 'reset',
    secret: opts.resetSecret,
    sign: { expiresIn: '15m' },
  });

  // Décorateur authenticate — fp() garantit sa disponibilité pour les routes
  fastify.register(authenticate);

  // Routes
  fastify.register(loginRoute, { prefix: '/v1/auth' });
  fastify.register(logoutRoute, { prefix: '/v1/auth' });
  fastify.register(signupRoute, { prefix: '/v1/auth' });
  fastify.register(refreshRoute, { prefix: '/v1/auth' });
  fastify.register(askPwdResetRoute, { prefix: '/v1/auth' });
  fastify.register(pwdResetRoute, { prefix: '/v1/auth' });
};

export const authPlugin = fp(auth, {
  name: '@ton-username/fastify-auth',
  fastify: '>=4.0.0',
});
