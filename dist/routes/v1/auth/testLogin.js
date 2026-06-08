export default async (fastify) => {
    fastify.get("/testLogin", {
        onRequest: fastify.authenticate,
    }, async (request, reply) => {
        reply.status(200).send(request.user);
    });
};
//# sourceMappingURL=testLogin.js.map