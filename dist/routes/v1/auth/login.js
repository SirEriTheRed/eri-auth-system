import { Type } from "typebox";
import argon2 from "argon2";
const UserLogin = Type.Object({
    id: Type.String(),
    password: Type.String(),
});
export default async (fastify) => {
    fastify.post("/login", { schema: { body: UserLogin } }, async (request, reply) => {
        const body = request.body;
        try {
            const user = await fastify.prisma.user.findUnique({
                select: {
                    id: true,
                    hashedPassword: true,
                },
                where: { id: body.id },
            });
            if (!user) {
                throw new Error("", { cause: "Not Found" });
            }
            if (!(await argon2.verify(user?.hashedPassword, body.password))) {
                throw new Error("", { cause: "Invalid Password" });
            }
            const accessToken = await reply.accessJwtSign({ userId: user.id });
            const refreshToken = await reply.refreshJwtSign({ userId: user.id });
            const decodedRefresh = fastify.jwt.refresh.decode(refreshToken);
            if (!decodedRefresh) {
                throw new Error("Failed to decode the refresh token");
            }
            await fastify.prisma.refreshToken.create({
                data: {
                    token: refreshToken,
                    userId: user.id,
                    expireAt: new Date(decodedRefresh.exp * 1000),
                },
            });
            reply
                .status(200)
                .setCookie("refreshToken", refreshToken, {
                domain: "localhost",
                path: "/",
                secure: true,
                httpOnly: true,
                sameSite: "none",
            })
                .send({ accessToken });
        }
        catch (error) {
            console.log(error);
            let errorMessage = "Unknown error during login";
            let errorCode = 401;
            if (error instanceof Error) {
                switch (error.cause) {
                    case "Not Found":
                        errorCode = 404;
                        errorMessage = "Could not find an user with this id";
                        break;
                    case "Invalid Password":
                        errorMessage = "This password is invalid";
                        errorCode = 401;
                        break;
                    default:
                        break;
                }
            }
            reply.status(errorCode).send(errorMessage);
        }
        finally {
            await fastify.prisma.$disconnect();
        }
    });
};
//# sourceMappingURL=login.js.map