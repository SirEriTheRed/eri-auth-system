import { Type } from "typebox";
const UserSignup = Type.Object({
    id: Type.String(),
    email: Type.String({ format: "email" }),
    birthday: Type.String({ format: "date" }),
});
export default async (fastify) => {
    fastify.post("/signup", { schema: { body: UserSignup } }, async (request, reply) => {
        const body = request.body;
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
        }
        catch (error) {
            let errorMessage = "Unknown error during signup";
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                switch (error.code) {
                    case "P2002":
                        const meta = error.meta;
                        const field = meta?.driverAdapterError?.cause?.constraint.fields[0];
                        errorMessage = `This ${field} is already used by another account`;
                        break;
                    default:
                        break;
                }
            }
            reply.status(500).send(errorMessage);
        }
        finally {
            await prisma.$disconnect();
        }
    });
};
//# sourceMappingURL=signup.js.map