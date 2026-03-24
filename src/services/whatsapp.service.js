// src/services/whatsapp.service.js
import { AppError } from '../shared/utils/AppError.js';

export const getWhatsAppNumber = () => {
  const number = process.env.WHATSAPP_NUMBER;
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
    `Price: KES ${product.price.toLocaleString()}`,
    `Quantity: ${quantity}`,
    `Total: KES ${(product.price * quantity).toLocaleString()}`,
    ``,
    `My details:`,
    `Username: ${user.username}`,
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