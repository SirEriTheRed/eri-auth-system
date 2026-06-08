import { Type } from "typebox";
import argon2 from "argon2";
const PwdResetBody = Type.Object({
    token: Type.String(),
    password: Type.String({ minLength: 8 }),
    passwordConfirm: Type.String({ minLength: 8 }),
});
export default async (fastify) => {
    fastify.patch("/pwdReset", { schema: { body: PwdResetBody } }, async (request, reply) => {
        const body = request.body;
        let user;
        try {
            user = (await fastify.jwt.reset.verify(body.token));
        }
        catch (error) {
            return reply.status(401).send("This link is invalid link");
        }
        const userId = user.userId;
        if (body.password !== body.passwordConfirm) {
            return reply.status(400).send("Passwords do not match");
        }
        try {
            await fastify.prisma.user.update({
                where: { id: userId },
                data: { hashedPassword: await argon2.hash(body.password) },
            });
            await fastify.prisma.refreshToken.updateMany({
                where: { userId: userId, revokedAt: null },
                data: {
                    revokedAt: new Date(),
                },
            });
            reply.status(201).send("Password reset sucessfully");
        }
        catch (error) {
            let errorMessage = "Unknown error during password reset";
            reply.status(500).send(errorMessage);
        }
        finally {
            await fastify.prisma.$disconnect();
        }
    });
};
//# sourceMappingURL=pwdReset.js.map