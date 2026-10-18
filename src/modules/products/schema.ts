
import { z } from "zod";

export const productIdSchema = z.string().uuid();

const moneySchema = z
  .number()
  .finite()
  .nonnegative()
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Amount must have at most two decimal places",
  );

const productFields = {
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).nullable(),
  price: moneySchema,
  costPrice: moneySchema,
  reorderLevel: z.number().int().nonnegative(),
};

export const createProductSchema = z
  .object({
    sku: productFields.sku,
    name: productFields.name,
    description: productFields.description.optional(),
    price: productFields.price,
    costPrice: productFields.costPrice,
    stockQuantity: z.number().int().nonnegative().optional().default(0),
    reorderLevel: productFields.reorderLevel.optional().default(10),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

export const updateProductSchema = z
  .object({
    sku: productFields.sku.optional(),
    name: productFields.name.optional(),
    description: productFields.description.optional(),
    price: productFields.price.optional(),
    costPrice: productFields.costPrice.optional(),
    reorderLevel: productFields.reorderLevel.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
