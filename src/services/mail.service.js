// src/services/mail.service.js
import { sendMail } from '../config/mailer.js';
import { logger } from '../shared/utils/logger.js';

export const sendVerificationEmail = async ({ to, username, verificationUrl }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1c0a00; padding: 24px; text-align: center;">
        <h1 style="color: #e07b39; margin: 0; font-size: 24px;">Manish Kejani</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Premium Home Store</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1c0a00; margin: 0 0 16px;">Verify your email address</h2>
        <p style="color: #555; line-height: 1.6;">Hi <strong>${username}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">
          Thank you for creating an account with Manish Kejani. Please verify your email address
          by clicking the button below. This link expires in 24 hours.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}"
             style="background: #e07b39; color: #ffffff; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">
          If you did not create this account, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 16px 24px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Manish Kejani. Kisii, Kenya.
        </p>
      </div>
    </div>
  `;

  const sent = await sendMail({
    to,
    subject: 'Verify your Manish Kejani account',
    html,
  });

  if (!sent) {
    logger.warn(`Verification email failed for ${to}`);
  }

  return sent;
};

export const sendPasswordResetEmail = async ({ to, username, resetCode }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1c0a00; padding: 24px; text-align: center;">
        <h1 style="color: #e07b39; margin: 0; font-size: 24px;">Manish Kejani</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 4px 0 0; font-size: 13px;">Premium Home Store</p>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #1c0a00; margin: 0 0 16px;">Reset your password</h2>
        <p style="color: #555; line-height: 1.6;">Hi <strong>${username}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">
          We received a request to reset your password. Use the verification code below.
          This code expires in <strong>15 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="background: #faf5ef; border: 2px dashed #e07b39; border-radius: 12px;
                      padding: 24px; display: inline-block;">
            <p style="margin: 0 0 8px; color: #999; font-size: 13px; letter-spacing: 0.05em;">
              YOUR RESET CODE
            </p>
            <p style="margin: 0; color: #1c0a00; font-size: 36px; font-weight: bold;
                      letter-spacing: 8px;">
              ${resetCode}
            </p>
          </div>
        </div>
        <p style="color: #999; font-size: 13px;">
          If you did not request a password reset, please ignore this email.
          Your password will remain unchanged.
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 16px 24px; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Manish Kejani. Kisii, Kenya.
        </p>
      </div>
    </div>
  `;

  const sent = await sendMail({
    to,
    subject: 'Your Manish Kejani password reset code',
    html,
  });

  if (!sent) {
    logger.warn(`Password reset email failed for ${to}`);
  }

  return sent;
};