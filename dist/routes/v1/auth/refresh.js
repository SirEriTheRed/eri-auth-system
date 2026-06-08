export default async (fastify) => {
    fastify.get("/refresh", async (request, reply) => {
        try {
            await request.refreshJwtVerify({ onlyCookie: true });
        }
        catch (error) {
            return reply
                .status(401)
                .send({ error: "Refresh token invalid, please log in" });
        }
        const newAccessToken = await reply.accessJwtSign({
            userId: request.refreshUser.userId,
        });
        return { accessToken: newAccessToken };
    });
};
//# sourceMappingURL=refresh.js.map