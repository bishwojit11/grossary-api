import { z } from 'zod';

const createGrocerySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    sku: z.string().min(1).max(64).optional(),
    price: z.coerce.number().positive(),
    stockQuantity: z.coerce.number().int().min(0).default(0),
  }),
});

const updateGrocerySchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      sku: z.string().min(1).max(64).nullable().optional(),
      price: z.coerce.number().positive().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, {
      message: 'At least one field is required to update.',
    }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

const inventorySchema = z.object({
  body: z.object({
    stockQuantity: z.coerce.number().int().min(0),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const adminListSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().max(200).optional(),
      includeInactive: z.enum(['true', 'false']).optional(),
    })
    .optional()
    .default({}),
});

const publicListSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().max(200).optional(),
    })
    .optional()
    .default({}),
});

export const GroceryValidation = {
  createGrocerySchema,
  updateGrocerySchema,
  inventorySchema,
  idParamSchema,
  adminListSchema,
  publicListSchema,
};
