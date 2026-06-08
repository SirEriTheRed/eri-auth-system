export default async (fastify) => {
    fastify.patch("/logout", { config: { rawBody: false } }, async (request, reply) => {
        try {
            await request.refreshJwtVerify({ onlyCookie: true });
            await fastify.prisma.refreshToken.update({
                where: {
                    token: request.cookies.refreshToken,
                },
                data: {
                    revokedAt: new Date(),
                },
            });
        }
        catch (error) {
            reply.code(401).send({ error: error });
        }
    });
};
//# sourceMappingURL=logout.js.map