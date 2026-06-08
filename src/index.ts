import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import authenticate from "./plugins/authenticate.js";
import loginRoute from "./routes/v1/auth/login.js";
import logoutRoute from "./routes/v1/auth/logout.js";
import signupRoute from "./routes/v1/auth/signup.js";
import refreshRoute from "./routes/v1/auth/refresh.js";
import askPwdResetRoute from "./routes/v1/auth/askPwdReset.js";
import pwdResetRoute from "./routes/v1/auth/pwdReset.js";
import type { PluginOptions } from "./types/plugin-options.js";

const authPlugin: FastifyPluginAsync<PluginOptions> = async (fastify, opts) => {
  fastify.decorate("prisma", opts.prisma);
  fastify.decorate("siteUrl", opts.siteUrl);

  await fastify.register(fastifyCookie);

  await fastify.register(fastifyJwt, {
    namespace: "access",
    secret: opts.accessSecret,
    sign: { expiresIn: "15m" },
  });

  await fastify.register(fastifyJwt, {
    namespace: "refresh",
    decoratorName: "refreshUser",
    secret: opts.refreshSecret,
    sign: { expiresIn: "7d" },
    trusted: async (request) => {
      try {
        const token = await opts.prisma.refreshToken.findUniqueOrThrow({
          where: { token: request.cookies.refreshToken },
          select: { revokedAt: true },
        });
        if (token.revokedAt) throw new Error();
        return true;
      } catch {
        return false;
      }
    },
    cookie: { cookieName: "refreshToken", signed: false },
  });

  await fastify.register(fastifyJwt, {
    namespace: "reset",
    secret: opts.resetSecret,
    sign: { expiresIn: "15m" },
  });

  await fastify.register(authenticate);

  await fastify.register(loginRoute, { prefix: "/v1/auth" });
  await fastify.register(logoutRoute, { prefix: "/v1/auth" });
  await fastify.register(signupRoute, { prefix: "/v1/auth" });
  await fastify.register(refreshRoute, { prefix: "/v1/auth" });
  await fastify.register(askPwdResetRoute, { prefix: "/v1/auth" });
  await fastify.register(pwdResetRoute, { prefix: "/v1/auth" });
};

export default fp(authPlugin, {
  name: "@ton-username/fastify-auth",
  fastify: ">=4.0.0",
});
