import { Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import { NotFoundException } from '../../../common/errors/apiError';

function mapGrocery(row: {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: Prisma.Decimal;
  stockQuantity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...row,
    price: row.price.toFixed(2),
  };
}

export const GroceryServices = {
  mapGrocery,

  async createGrocery(payload: {
    name: string;
    description?: string;
    sku?: string;
    price: number;
    stockQuantity: number;
  }) {
    const created = await prisma.groceryItem.create({
      data: {
        name: payload.name,
        description: payload.description,
        sku: payload.sku,
        price: new Prisma.Decimal(payload.price.toFixed(2)),
        stockQuantity: payload.stockQuantity,
      },
    });
    return mapGrocery(created);
  },

  async listPublic(options: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GroceryItemWhereInput = {
      isActive: true,
      stockQuantity: { gt: 0 },
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { description: { contains: options.search, mode: 'insensitive' } },
              { sku: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.groceryItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.groceryItem.count({ where }),
    ]);

    return {
      items: rows.map(mapGrocery),
      meta: {
        page,
        limit,
        totalDocs: total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + rows.length < total,
        hasPrevPage: page > 1,
      },
    };
  },

  async listAdmin(options: {
    page?: number;
    limit?: number;
    search?: string;
    includeInactive?: boolean;
  }) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.GroceryItemWhereInput = {
      ...(options.includeInactive ? {} : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              { description: { contains: options.search, mode: 'insensitive' } },
              { sku: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (!options.includeInactive) {
      where.isActive = true;
    }

    const [rows, total] = await Promise.all([
      prisma.groceryItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.groceryItem.count({ where }),
    ]);

    return {
      items: rows.map(mapGrocery),
      meta: {
        page,
        limit,
        totalDocs: total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: skip + rows.length < total,
        hasPrevPage: page > 1,
      },
    };
  },

  async getById(id: string) {
    const row = await prisma.groceryItem.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Grocery item not found.');
    return mapGrocery(row);
  },

  async updateGrocery(
    id: string,
    payload: {
      name?: string;
      description?: string | null;
      sku?: string | null;
      price?: number;
      isActive?: boolean;
    },
  ) {
    try {
      const updated = await prisma.groceryItem.update({
        where: { id },
        data: {
          ...(payload.name !== undefined ? { name: payload.name } : {}),
          ...(payload.description !== undefined
            ? { description: payload.description }
            : {}),
          ...(payload.sku !== undefined ? { sku: payload.sku } : {}),
          ...(payload.price !== undefined
            ? { price: new Prisma.Decimal(payload.price.toFixed(2)) }
            : {}),
          ...(payload.isActive !== undefined
            ? { isActive: payload.isActive }
            : {}),
        },
      });
      return mapGrocery(updated);
    } catch {
      throw new NotFoundException('Grocery item not found.');
    }
  },

  async setInventory(id: string, stockQuantity: number) {
    try {
      const updated = await prisma.groceryItem.update({
        where: { id },
        data: { stockQuantity },
      });
      return mapGrocery(updated);
    } catch {
      throw new NotFoundException('Grocery item not found.');
    }
  },

  async softRemove(id: string) {
    try {
      const updated = await prisma.groceryItem.update({
        where: { id },
        data: { isActive: false },
      });
      return mapGrocery(updated);
    } catch {
      throw new NotFoundException('Grocery item not found.');
    }
  },
};
