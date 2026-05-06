import express from 'express';
import validateRequest from '../../../common/middlewares/validateRequest';
import authenticate from '../../../common/middlewares/authenticate';
import { GroceryValidation } from './grocery.validation';
import { GroceryControllers } from './grocery.controller';

const publicRouter = express.Router();

publicRouter.get(
  '/',
  validateRequest(GroceryValidation.publicListSchema),
  GroceryControllers.listPublicGroceries,
);

const adminRouter = express.Router();

adminRouter.post(
  '/',
  validateRequest(GroceryValidation.createGrocerySchema),
  GroceryControllers.createGrocery,
);

adminRouter.get(
  '/',
  validateRequest(GroceryValidation.adminListSchema),
  GroceryControllers.listAdminGroceries,
);

adminRouter.get(
  '/:id',
  validateRequest(GroceryValidation.idParamSchema),
  GroceryControllers.getAdminGroceryById,
);

adminRouter.patch(
  '/:id',
  validateRequest(GroceryValidation.updateGrocerySchema),
  GroceryControllers.updateGrocery,
);

adminRouter.patch(
  '/:id/inventory',
  validateRequest(GroceryValidation.inventorySchema),
  GroceryControllers.updateInventory,
);

adminRouter.delete(
  '/:id',
  validateRequest(GroceryValidation.idParamSchema),
  GroceryControllers.removeGrocery,
);

const adminStack = express.Router();
adminStack.use(authenticate);
adminStack.use(adminRouter);

export const GroceryPublicRouters = publicRouter;
export const GroceryAdminRouters = adminStack;
