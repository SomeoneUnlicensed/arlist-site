import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // cert CN doesn't match mail.leetcot.ru — disable hostname check
    rejectUnauthorized: false,
  },
});

export const sendVerificationEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Arlist" <noreply@arlist.ru>',
    to,
    subject: 'Подтверждение регистрации Arlist',
    text: `Ваш код подтверждения: ${code}`,
    html: `<b>Ваш код подтверждения: ${code}</b>`,
  };

  return transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (to: string, token: string) => {
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
