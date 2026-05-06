import express, { Application } from 'express';
import { AuthRouters } from '../modules/auth/auth.route';
import {
  GroceryAdminRouters,
  GroceryPublicRouters,
} from '../modules/grocery/grocery.route';
import { OrderRouters } from '../modules/order/order.route';

const getApiRoutes = () => {
  const router = express.Router();
  router.use('/auth', AuthRouters);
  router.use('/groceries', GroceryPublicRouters);
  router.use('/admin/groceries', GroceryAdminRouters);
  router.use('/orders', OrderRouters);
  return router;
};

export const setupApiRoutes = (app: Application): void => {
  app.use('/api/v1', getApiRoutes());
};
