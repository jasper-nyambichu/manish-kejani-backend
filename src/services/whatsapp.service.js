// src/services/whatsapp.service.js
import { AppError } from '../shared/utils/AppError.js';

/** Used by GET /api/v1/whatsapp/number — matches storefront fallback when unset (see frontend VITE_WHATSAPP_NUMBER). */
export const getWhatsAppNumberOptional = () => {
  const n = process.env.WHATSAPP_NUMBER?.trim();
  return n || null;
};

/** Used when a configured number is required (e.g. POST /whatsapp/order/:productId). */
export const getWhatsAppNumber = () => {
  const number = getWhatsAppNumberOptional();
  if (!number) throw new AppError('WhatsApp number not configured', 500);
  return number;
};

export const buildOrderMessage = ({ product, user, quantity = 1 }) => {
  if (!product || !user) throw new AppError('Product and user are required', 400);

  const lines = [
    `Hi Manish Kejani 👋`,
    `I'd like to order the following:`,
    ``,
    `Product: ${product.name}`,
    `Price: KSh ${product.price.toLocaleString()}`,
    `Quantity: ${quantity}`,
    `Total: KSh ${(product.price * quantity).toLocaleString()}`,
    ``,
    `My details:`,
    `Name: ${user.username}`,
    `Phone: ${user.phone ?? 'Not provided'}`,
    ``,
    `Please confirm availability and delivery. Thank you!`,
  ];

  return lines.join('\n');
};

export const buildWhatsAppUrl = ({ product, user, quantity = 1 }) => {
  const number = getWhatsAppNumber();
  const message = buildOrderMessage({ product, user, quantity });
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
};