import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import {
  BadRequestException,
  NotFoundException,
} from '../../../common/errors/apiError';

function mapOrder(order: {
  id: string;
  userId: string;
  totalAmount: Prisma.Decimal;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lines: Array<{
    id: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
    groceryItem: { id: string; name: string; sku: string | null };
  }>;
}) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    totalAmount: order.totalAmount.toFixed(2),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    lines: order.lines.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      unitPrice: l.unitPrice.toFixed(2),
      lineTotal: l.lineTotal.toFixed(2),
      groceryItem: l.groceryItem,
    })),
  };
}

export const OrderServices = {
  mapOrder,

  async createOrderFromBooking(params: {
    userId: string;
    items: { groceryItemId: string; quantity: number }[];
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const lines: Array<{
        groceryItemId: string;
        quantity: number;
        unit: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }> = [];

      let total = new Prisma.Decimal(0);

      for (const line of params.items) {
        const item = await tx.groceryItem.findUnique({
          where: { id: line.groceryItemId },
        });

        if (!item) {
          throw new NotFoundException(
            `Grocery item ${line.groceryItemId} not found.`,
          );
        }
        if (!item.isActive) {
          throw new BadRequestException(`Item "${item.name}" is not available.`);
        }
        if (item.stockQuantity < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${item.name}". Available: ${item.stockQuantity}.`,
          );
        }

        const unit = item.price;
        const lineTotal = unit.mul(line.quantity);
        total = total.add(lineTotal);

        lines.push({
          groceryItemId: item.id,
          quantity: line.quantity,
          unit,
          lineTotal,
        });
      }

      const order = await tx.order.create({
        data: {
          userId: params.userId,
          totalAmount: total,
          status: OrderStatus.BOOKED,
          lines: {
            create: lines.map((l) => ({
              groceryItemId: l.groceryItemId,
              quantity: l.quantity,
              unitPrice: l.unit,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: {
          lines: {
            include: {
              groceryItem: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      });

      for (const line of params.items) {
        await tx.groceryItem.update({
          where: { id: line.groceryItemId },
          data: {
            stockQuantity: { decrement: line.quantity },
          },
        });
      }

      return order;
    });

    return mapOrder(result);
  },

  async listForUser(userId: string, page?: number, limit?: number) {
    const p = page ?? 1;
    const l = limit ?? 20;
    const skip = (p - 1) * l;

    const where = { userId };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          lines: {
            include: {
              groceryItem: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map(mapOrder),
      meta: {
        page: p,
        limit: l,
        totalDocs: total,
        totalPages: Math.ceil(total / l) || 1,
        hasNextPage: skip + orders.length < total,
        hasPrevPage: p > 1,
      },
    };
  },

  async listAll(page?: number, limit?: number) {
    const p = page ?? 1;
    const l = limit ?? 20;
    const skip = (p - 1) * l;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          lines: {
            include: {
              groceryItem: {
                select: { id: true, name: true, sku: true },
              },
            },
          },
        },
      }),
      prisma.order.count(),
    ]);

    return {
      orders: orders.map(mapOrder),
      meta: {
        page: p,
        limit: l,
        totalDocs: total,
        totalPages: Math.ceil(total / l) || 1,
        hasNextPage: skip + orders.length < total,
        hasPrevPage: p > 1,
      },
    };
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            groceryItem: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found.');
    return mapOrder(order);
  },
};
