
import { z } from "zod";

export const stockAdjustmentIdSchema = z.string().uuid();

export const createStockAdjustmentSchema = z
  .object({
    productId: z.string().uuid(),
    quantityChange: z
      .number()
      .int()
      .refine((value) => value !== 0, {
        message: "quantityChange must be non-zero",
      }),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export const listStockAdjustmentsQuerySchema = z
  .object({
    productId: z.string().uuid().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
  })
  .strict();
