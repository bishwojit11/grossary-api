import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Role } from '@prisma/client';
import {
  ISession,
  OrderAbilityBuilder,
  OrderAuthZEntity,
} from '../../../authz';
import { AbilityAction } from '../../../enums';
import { ForbiddenException, UnauthorizedException } from '../../../common/errors/apiError';
import catchAsync from '../../../common/utils/catchAsync';
import sendResponse from '../../../common/utils/sendResponse';
import { OrderServices } from './order.service';

const assertOrderCreate = (req: Request) => {
  if (!req.session?.user) {
    throw new UnauthorizedException('Unauthorized.');
  }
  const ability = new OrderAbilityBuilder(req.session as ISession);
  if (
    !ability
      .getAbility()
      .can(
        AbilityAction.Create,
        new OrderAuthZEntity({ userId: req.session.user.id }),
      )
  ) {
    throw new ForbiddenException(
      'You are not allowed to place grocery bookings with this account.',
    );
  }
};

const assertOrderRead = (req: Request, subject: OrderAuthZEntity) => {
  const ability = new OrderAbilityBuilder(req.session as ISession);
  if (!ability.getAbility().can(AbilityAction.Read, subject)) {
    throw new ForbiddenException('You are not allowed to view this order.');
  }
};

export const createOrder = catchAsync(async (req: Request, res: Response) => {
  assertOrderCreate(req);

  const order = await OrderServices.createOrderFromBooking({
    userId: req.session!.user!.id,
    items: req.body.items,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Order booked successfully.',
    data: order,
  });
});

export const listOrders = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;
  const page = q.page ? Number(q.page) : undefined;
  const limit = q.limit ? Number(q.limit) : undefined;

  if (req.session?.user?.role === Role.ADMIN) {
    const result = await OrderServices.listAll(page, limit);
    return sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Orders retrieved.',
      data: result.orders,
      meta: result.meta,
    });
  }

  const ability = new OrderAbilityBuilder(req.session as ISession);
  if (
    !ability
      .getAbility()
      .can(
        AbilityAction.Read,
        new OrderAuthZEntity({ userId: req.session!.user!.id }),
      )
  ) {
    throw new ForbiddenException('Not allowed.');
  }

  const result = await OrderServices.listForUser(req.session!.user!.id, page, limit);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your orders retrieved.',
    data: result.orders,
    meta: result.meta,
  });
});

export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const order = await OrderServices.getById(id);

  assertOrderRead(
    req,
    new OrderAuthZEntity({ userId: order.userId }),
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Order retrieved.',
    data: order,
  });
});

export const OrderControllers = {
  createOrder,
  listOrders,
  getOrderById,
};
