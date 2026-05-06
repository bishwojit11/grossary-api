import { z } from 'zod';

const createOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          groceryItemId: z.string().uuid(),
          quantity: z.coerce.number().int().min(1).max(9999),
        }),
      )
      .min(1),
  }),
});

const listOrdersSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .optional()
    .default({}),
});

const orderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const OrderValidation = {
  createOrderSchema,
  listOrdersSchema,
  orderIdSchema,
};
