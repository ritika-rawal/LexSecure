import nodemailer from 'nodemailer';

import { appConfig } from '../config/app.config.js';

let transporter;

const getTransporter = () => {
  if (!appConfig.smtp) {
    const error = new Error('Password reset is temporarily unavailable.');
    error.statusCode = 503;
    throw error;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: appConfig.smtp.host,
      port: appConfig.smtp.port,
      secure: appConfig.smtp.secure,
      requireTLS: appConfig.smtp.requireTls,
      ...(appConfig.smtp.user
        ? {
            auth: {
              user: appConfig.smtp.user,
              pass: appConfig.smtp.password,
            },
          }
        : {}),
    });
  }

  return transporter;
};

export const assertEmailDeliveryConfigured = () => {
  getTransporter();
};

export const sendPasswordResetEmail = async ({ recipient, resetUrl }) => {
  await getTransporter().sendMail({
    from: appConfig.smtp.from,
    to: recipient,
    subject: 'Reset your LexSecure password',
    text: [
      'A password reset was requested for your LexSecure account.',
      '',
      `Open this link within 15 minutes: ${resetUrl}`,
      '',
      'If you did not request this change, you can ignore this email. Your password has not changed.',
    ].join('\n'),
  });
};
