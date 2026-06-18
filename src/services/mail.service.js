"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPasswordEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const sendVerificationEmail = async (to, code) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Arlist" <noreply@arlist.ru>',
        to,
        subject: 'Подтверждение регистрации Arlist',
        text: `Ваш код подтверждения: ${code}`,
        html: `<b>Ваш код подтверждения: ${code}</b>`,
    };
    return transporter.sendMail(mailOptions);
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendResetPasswordEmail = async (to, token) => {
    const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_FROM || '"Arlist" <noreply@arlist.ru>',
        to,
        subject: 'Сброс пароля Arlist',
        text: `Для сброса пароля перейдите по ссылке: ${resetUrl}`,
        html: `Для сброса пароля <a href="${resetUrl}">нажмите здесь</a>`,
    };
    return transporter.sendMail(mailOptions);
};
exports.sendResetPasswordEmail = sendResetPasswordEmail;
//# sourceMappingURL=mail.service.js.map