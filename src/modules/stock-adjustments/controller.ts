
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  createStockAdjustmentSchema,
  listStockAdjustmentsQuerySchema,
  stockAdjustmentIdSchema,
} from "./schema.js";

const adjustmentInclude = {
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      isActive: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.StockMovementInclude;

function handleError(error: unknown, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Stock adjustment not found" });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        error:
          "This stock adjustment conflicted with another update. Please retry.",
      });
    }
  }

  console.error("Stock adjustments API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

export const createStockAdjustment = async (
  req: Request,
  res: Response,
) => {
  const userId = req.authUser?.id;

  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const parsed = createStockAdjustmentSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid stock adjustment data",
      details: parsed.error.issues,
    });
  }

  const { productId, quantityChange, reason } = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            sku: true,
            name: true,
            stockQuantity: true,
            isActive: true,
          },
        });

        if (!product) {
          return { kind: "not_found" as const };
        }

        if (!product.isActive) {
          return { kind: "inactive" as const };
        }

        const nextQuantity = product.stockQuantity + quantityChange;

        if (nextQuantity < 0) {
          return {
            kind: "negative" as const,
            currentQuantity: product.stockQuantity,
          };
        }

        const updateWhere = {
          id: productId,
          isActive: true,
          ...(quantityChange < 0
            ? { stockQuantity: { gte: Math.abs(quantityChange) } }
            : {}),
        };

        const updatedProduct = await tx.product.update({
          where: updateWhere,
          data: {
            stockQuantity: {
              increment: quantityChange,
            },
          },
          select: {
            id: true,
            sku: true,
            name: true,
            stockQuantity: true,
            isActive: true,
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            productId,
            createdById: userId,
            purchaseOrderId: null,
            type: "ADJUSTMENT",
            quantityChange,
            quantityAfter: updatedProduct.stockQuantity,
            reason,
            unitCost: null,
          },
          include: adjustmentInclude,
        });

        return {
          kind: "ok" as const,
          product: updatedProduct,
          adjustment: movement,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    if (result.kind === "not_found") {
      return res.status(404).json({ error: "Product not found" });
    }

    if (result.kind === "inactive") {
      return res.status(409).json({
        error: "Cannot adjust an inactive product",
      });
    }

    if (result.kind === "negative") {
      return res.status(409).json({
        error: "Adjustment would make stock quantity negative",
        currentQuantity: result.currentQuantity,
      });
    }

    return res.status(201).json({
      product: result.product,
      adjustment: result.adjustment,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(409).json({
          error:
            "Stock adjustment could not be completed due to a concurrent update",
        });
      }

      if (error.code === "P2034") {
        return res.status(409).json({
          error: "A concurrent stock update occurred. Please retry the adjustment.",
        });
      }
    }

    return handleError(error, res);
  }
};

export const listStockAdjustments = async (
  req: Request,
  res: Response,
) => {
  const parsed = listStockAdjustmentsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: parsed.error.issues,
    });
  }

  const { productId, limit = 25, offset = 0 } = parsed.data;

  try {
    const where: Prisma.StockMovementWhereInput = {
      type: "ADJUSTMENT",
      ...(productId ? { productId } : {}),
    };

    const [adjustments, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: adjustmentInclude,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return res.status(200).json({
      adjustments,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + adjustments.length < total,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getStockAdjustmentById = async (
  req: Request,
  res: Response,
) => {
  const parsed = stockAdjustmentIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid stock adjustment id" });
  }

  try {
    const adjustment = await prisma.stockMovement.findFirst({
      where: {
        id: parsed.data,
        type: "ADJUSTMENT",
      },
      include: adjustmentInclude,
    });

    if (!adjustment) {
      return res.status(404).json({ error: "Stock adjustment not found" });
    }

    return res.status(200).json({ adjustment });
  } catch (error) {
    return handleError(error, res);
  }
};
