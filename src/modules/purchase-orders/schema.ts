
import { z } from "zod";

export const purchaseOrderIdSchema = z.string().uuid();

const moneySchema = z
  .number()
  .finite()
  .nonnegative()
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8,
    "Amount must have at most two decimal places",
  );

const itemSchema = z
  .object({
    productId: z.string().uuid(),
    orderedQuantity: z.number().int().positive(),
    unitCost: moneySchema,
  })
  .strict();

const itemsSchema = z
  .array(itemSchema)
  .min(1, "A purchase order must contain at least one item")
  .superRefine((items, context) => {
    const productIds = new Set<string>();

    items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: "custom",
          path: [index, "productId"],
          message: "A product can only appear once per purchase order",
        });
      }

      productIds.add(item.productId);
    });
  });

export const createPurchaseOrderSchema = z
  .object({
    supplierId: z.string().uuid(),
    notes: z.string().trim().max(1000).nullable().optional(),
    items: itemsSchema,
  })
  .strict();

export const updatePurchaseOrderSchema = z
  .object({
    supplierId: z.string().uuid().optional(),
    notes: z.string().trim().max(1000).nullable().optional(),
    items: itemsSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });


  const receiveItemSchema = z
  .object({
    productId: z.string().uuid(),
    receivedQuantity: z.number().int().positive(),
  })
  .strict();

export const receivePurchaseOrderSchema = z
  .object({
    items: z
      .array(receiveItemSchema)
      .min(1, "Provide at least one item to receive")
      .superRefine((items, context) => {
        const productIds = new Set<string>();

        items.forEach((item, index) => {
          if (productIds.has(item.productId)) {
            context.addIssue({
              code: "custom",
              path: [index, "productId"],
              message: "A product can only appear once per receiving request",
            });
          }

          productIds.add(item.productId);
        });
      }),
  })
  .strict();