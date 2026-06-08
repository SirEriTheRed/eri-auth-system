import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";

const askPwdResetBody = Type.Object({
  userId: Type.String(),
});
type askPwdResetBody = Static<typeof askPwdResetBody>;

export default async (fastify: FastifyInstance) => {
  fastify.post(
    "/askPwdReset",
    { schema: { body: askPwdResetBody } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as askPwdResetBody;

      const user: { id: string; email: string } | null =
        await fastify.prisma.user.findUnique({
          select: {
            id: true,
            email: true,
          },
          where: { id: body.userId },
        });

      const resetToken = await reply.resetJwtSign({ userId: user!.id });
      const resetLink = `${fastify.siteUrl}/reset-password?token=${resetToken}`;
      await fastify.sendResetEmail(user!.email, resetLink);
    },
  );
};
