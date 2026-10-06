import { Router } from 'express';
import { getOrders, getOrder, createOrder, cancelOrder } from '../controllers/ordersController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.get('/',         getOrders);
router.post('/',        validate(createOrderSchema), createOrder);
router.get('/:id',      getOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;
