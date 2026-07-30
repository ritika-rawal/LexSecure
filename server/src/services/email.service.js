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

export const sendVerificationEmail = async ({ recipient, verificationUrl }) => {
  if (!appConfig.smtp) {
    // No SMTP configured in this environment (e.g. local development). Log the
    // link so the flow remains testable without a real mail server.
    console.log(`[dev-only] Email verification link for ${recipient}: ${verificationUrl}`);
    return;
  }

  await getTransporter().sendMail({
    from: appConfig.smtp.from,
    to: recipient,
    subject: 'Verify your LexSecure email address',
    text: [
      'Thanks for registering with LexSecure.',
      '',
      `Verify your email within 24 hours: ${verificationUrl}`,
      '',
      'If you did not create this account, you can ignore this email.',
    ].join('\n'),
  });
};
