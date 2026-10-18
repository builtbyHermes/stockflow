//purely validation purposes
import { z } from "zod";

export const supplierIdSchema = z.string().uuid();

const supplierFields = {
  name: z.string().trim().min(1).max(200),
  email: z.email().trim().max(254).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
};

export const createSupplierSchema = z
  .object(supplierFields)
  .strict();

export const updateSupplierSchema = z
  .object({
    name: supplierFields.name.optional(),
    email: supplierFields.email,
    phone: supplierFields.phone,
    address: supplierFields.address,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  });
