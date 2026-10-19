import { z } from "zod";

export const stockMovementIdSchema = z.string().uuid();

export const stockMovementTypeSchema = z.enum([
  "PURCHASE",
  "SALE",
  "ADJUSTMENT",
  "RETURN",
]);

const ISO_UTC_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

const isoDateStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => ISO_UTC_DATE_REGEX.test(value), {
    message: "Date must be in ISO 8601 format such as YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ",
  })
  .refine((value) => {
    const normalizedValue = value.includes("T") && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
      ? `${value}Z`
      : value;

    return !Number.isNaN(new Date(normalizedValue).getTime());
  }, {
    message: "Date is not a valid ISO 8601 value",
  });

const intStringSchema = (min: number, max?: number) =>
  z
    .string()
    .trim()
    .refine((value) => value !== "" && /^\d+$/.test(value), {
      message: "Value must be a whole number string",
    })
    .refine((value) => Number(value) >= min, {
      message: `Value must be greater than or equal to ${min}`,
    })
    .refine((value) => (max === undefined ? true : Number(value) <= max), {
      message: max === undefined ? "Value is out of range" : `Value must be less than or equal to ${max}`,
    });

export const listStockMovementsQuerySchema = z
  .object({
    productId: z.string().uuid().optional(),
    type: stockMovementTypeSchema.optional(),
    startDate: isoDateStringSchema.optional(),
    endDate: isoDateStringSchema.optional(),
    limit: intStringSchema(1, 100).optional(),
    offset: intStringSchema(0).optional(),
  })
  .strict()
  .refine((data) => {
    if (!data.startDate || !data.endDate) {
      return true;
    }

    return new Date(data.startDate).getTime() <= new Date(data.endDate).getTime();
  }, {
    message: "startDate must be earlier than or equal to endDate",
    path: ["startDate"],
  });
