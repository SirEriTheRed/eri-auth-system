import { Type } from "typebox";
import { sendEmail } from "../../../services/mailer.js";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const askPwdResetBody = Type.Object({
    userId: Type.String(),
});
export default async (fastify) => {
    fastify.post("/askPwdReset", { schema: { body: askPwdResetBody } }, async (request, reply) => {
        const body = request.body;
        const user = await fastify.prisma.user.findUnique({
            select: {
                id: true,
                email: true,
            },
            where: { id: body.userId },
        });
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const templatePath = path.join(__dirname, "../../../mailTemplates/passwordChange.html");
        const templateSource = fs.readFileSync(templatePath, "utf8");
        const resetToken = await reply.resetJwtSign({ userId: user.id });
        const template = Handlebars.compile(templateSource);
        const html = template({
            userName: user.id,
            resetLink: `${process.env.SITE_URL}/reset-password?token=${resetToken}`,
        });
        sendEmail([user.email], [], [], "Password Change Request", "This is a test email.", html, []);
    });
};
//# sourceMappingURL=askPwdReset.js.map