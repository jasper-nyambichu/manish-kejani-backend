// src/routes/public/whatsapp.routes.js
import { Router } from 'express';
import { getWhatsAppNumberOptional, buildWhatsAppUrl } from '../../services/whatsapp.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';
import asyncHandler from '../../shared/utils/asyncHandler.js';
import { protect } from '../../middleware/userAuth.js';
import Product from '../../models/product.model.js';
import { AppError } from '../../shared/utils/AppError.js';

const router = Router();

router.get('/number', (_req, res) => {
  const number = getWhatsAppNumberOptional();
  sendSuccess(res, 200, 'WhatsApp number retrieved', { number });
});

router.post('/order/:productId', protect, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) throw new AppError('Product not found', 404);

  const { quantity = 1 } = req.body;

  const url = buildWhatsAppUrl({ product, user: req.user, quantity });
  sendSuccess(res, 200, 'WhatsApp order URL generated', { url });
}));

export default router;