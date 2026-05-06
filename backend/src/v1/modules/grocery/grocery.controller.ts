import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  GroceryAbilityBuilder,
  GroceryAuthZEntity,
  ISession,
} from '../../../authz';
import { AbilityAction } from '../../../enums';
import { UnauthorizedException } from '../../../common/errors/apiError';
import catchAsync from '../../../common/utils/catchAsync';
import sendResponse from '../../../common/utils/sendResponse';
import { GroceryServices } from './grocery.service';

const assertGroceryManage = (req: Request) => {
  const ability = new GroceryAbilityBuilder(req.session as ISession);
  if (
    !ability
      .getAbility()
      .can(AbilityAction.Manage, new GroceryAuthZEntity({}))
  ) {
    throw new UnauthorizedException(
      `User ${req.session?.user?.id} is not authorized to manage groceries.`,
    );
  }
};

export const createGrocery = catchAsync(async (req: Request, res: Response) => {
  assertGroceryManage(req);

  const created = await GroceryServices.createGrocery(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Grocery item created.',
    data: created,
  });
});

export const listAdminGroceries = catchAsync(
  async (req: Request, res: Response) => {
    assertGroceryManage(req);

    const q = req.query as Record<string, string | undefined>;
    const result = await GroceryServices.listAdmin({
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
      search: q.search,
      includeInactive: q.includeInactive === 'true',
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Grocery items retrieved.',
      data: result.items,
      meta: result.meta,
    });
  },
);

export const getAdminGroceryById = catchAsync(
  async (req: Request, res: Response) => {
    assertGroceryManage(req);
    const { id } = req.params as { id: string };
    const item = await GroceryServices.getById(id);
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Grocery item retrieved.',
      data: item,
    });
  },
);

export const updateGrocery = catchAsync(async (req: Request, res: Response) => {
  assertGroceryManage(req);
  const { id } = req.params as { id: string };
  const updated = await GroceryServices.updateGrocery(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Grocery item updated.',
    data: updated,
  });
});

export const updateInventory = catchAsync(async (req: Request, res: Response) => {
  assertGroceryManage(req);
  const { id } = req.params as { id: string };
  const updated = await GroceryServices.setInventory(
    id,
    req.body.stockQuantity,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Inventory updated.',
    data: updated,
  });
});

export const removeGrocery = catchAsync(async (req: Request, res: Response) => {
  assertGroceryManage(req);
  const { id } = req.params as { id: string };
  const updated = await GroceryServices.softRemove(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Grocery item removed from availability.',
    data: updated,
  });
});

export const listPublicGroceries = catchAsync(
  async (req: Request, res: Response) => {
    const q = req.query as Record<string, string | undefined>;
    const result = await GroceryServices.listPublic({
      page: q.page ? Number(q.page) : undefined,
      limit: q.limit ? Number(q.limit) : undefined,
      search: q.search,
    });

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Available grocery items retrieved.',
      data: result.items,
      meta: result.meta,
    });
  },
);

export const GroceryControllers = {
  createGrocery,
  listAdminGroceries,
  getAdminGroceryById,
  updateGrocery,
  updateInventory,
  removeGrocery,
  listPublicGroceries,
};
