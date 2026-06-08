import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import authenticate from "./plugins/authenticate.js";
import loginRoute from "./routes/v1/auth/login.js";
import logoutRoute from "./routes/v1/auth/logout.js";
import signupRoute from "./routes/v1/auth/signup.js";
import refreshRoute from "./routes/v1/auth/refresh.js";
import askPwdResetRoute from "./routes/v1/auth/askPwdReset.js";
import pwdResetRoute from "./routes/v1/auth/pwdReset.js";
const authPlugin = async (fastify, opts) => {
    // 1. Décorer fastify avec prisma
    fastify.decorate("prisma", opts.prisma);
    // 2. Cookie
    await fastify.register(fastifyCookie);
    // 3. Les 3 namespaces JWT (identiques à ton app.ts actuel)
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
                if (token.revokedAt)
                    throw new Error();
                return true;
            }
            catch {
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
    // 4. Plugin authenticate (decorator fastify.authenticate)
    await fastify.register(authenticate);
    // 5. Routes auth
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
//# sourceMappingURL=index.js.map