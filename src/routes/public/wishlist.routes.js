// src/routes/public/wishlist.routes.js
import { Router } from 'express';
import { listWishlist, addItem, removeItem } from '../../controllers/public/wishlist.controller.js';
import { protect } from '../../middleware/userAuth.js';

const router = Router();

router.use(protect);

router.get('/',                    listWishlist);
router.post('/:productId',         addItem);
router.delete('/:productId',       removeItem);

export default router;
