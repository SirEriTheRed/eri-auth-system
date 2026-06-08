import fp from "fastify-plugin";
export default fp(async (fastify) => {
    fastify.decorate("authenticate", async (request, reply) => {
        try {
            await request.accessJwtVerify();
        }
        catch {
            return reply
                .status(401)
                .send({ error: "Access token invalid, please refresh the token" });
        }
    });
});
//# sourceMappingURL=authenticate.js.map