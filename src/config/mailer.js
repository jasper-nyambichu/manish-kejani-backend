// src/config/mailer.js
import { Resend } from 'resend';
import { logger } from '../shared/utils/logger.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendMail = async ({ to, subject, html }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      logger.error(`Resend error: ${error.message}`);
      return false;
    }

    logger.info(`Email sent to ${to} — id: ${data.id}`);
    return true;
  } catch (err) {
    logger.error(`sendMail failed: ${err.message}`);
    return false;
  }
};