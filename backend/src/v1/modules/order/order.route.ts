import express from 'express';
import validateRequest from '../../../common/middlewares/validateRequest';
import authenticate from '../../../common/middlewares/authenticate';
import { OrderValidation } from './order.validation';
import { OrderControllers } from './order.controller';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  validateRequest(OrderValidation.createOrderSchema),
  OrderControllers.createOrder,
);

router.get(
  '/',
  validateRequest(OrderValidation.listOrdersSchema),
  OrderControllers.listOrders,
);

router.get(
  '/:id',
  validateRequest(OrderValidation.orderIdSchema),
  OrderControllers.getOrderById,
);

export const OrderRouters = router;
