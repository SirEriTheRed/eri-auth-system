import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
    host: "localhost",
    port: 1025,
    secure: false,
});
export async function sendEmail(to, cc, bcc, subject, text, html, attachments) {
    try {
        await transporter.verify();
        const mail = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: to,
            cc: cc,
            bcc: bcc,
            subject: subject,
            text: text,
            html: html,
            attachments: attachments,
        });
        if (mail.rejected.length > 0) {
            throw new Error("Failed to send email to at least one recipient");
        }
    }
    catch (error) {
        throw new Error(`Failed to send email: ${error}`);
    }
}
//# sourceMappingURL=mailer.js.map