import type { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const UserSignup = Type.Object({
  id: Type.String(),
  email: Type.String({ format: "email" }),
  birthday: Type.String({ format: "date" }),
});
type UserSignupBody = Static<typeof UserSignup>;

export default async (fastify: FastifyInstance) => {
  fastify.post(
    "/signup",
    { schema: { body: UserSignup } },
    async (
      request: FastifyRequest<{ Body: UserSignupBody }>,
      reply: FastifyReply,
    ) => {
      const body: UserSignupBody = request.body;
      try {
        await fastify.prisma.user.create({
          data: {
            id: body.id,
            name: body.id,
            email: body.email,
            hashedPassword: "",
            birthday: new Date(body.birthday),
          },
        });
        reply.status(201).send("User created sucessfully");
      } catch (error) {
        let errorMessage: string = "Unknown error during signup";

        if (error instanceof PrismaClientKnownRequestError) {
          switch (error.code) {
            case "P2002":
              const meta = error.meta as any;
              const field =
                meta?.driverAdapterError?.cause?.constraint.fields[0];
              errorMessage = `This ${field} is already used by another account`;
              break;

            default:
              break;
          }
        }
        reply.status(500).send(errorMessage);
      } finally {
        await fastify.prisma.$disconnect();
      }
    },
  );
};
