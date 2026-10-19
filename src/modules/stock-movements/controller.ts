import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  listStockMovementsQuerySchema,
  stockMovementIdSchema,
} from "./schema.js";

const movementInclude = {
  product: {
    select: {
      id: true,
      sku: true,
      name: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  purchaseOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
    },
  },
} satisfies Prisma.StockMovementInclude;

function normalizeDateRange(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      start: new Date(`${trimmed}T00:00:00.000Z`),
      end: new Date(`${trimmed}T23:59:59.999Z`),
    };
  }

  const normalizedValue = /T/.test(trimmed) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)
    ? `${trimmed}Z`
    : trimmed;

  const parsed = new Date(normalizedValue);

  return {
    start: parsed,
    end: parsed,
  };
}

function handleError(error: unknown, res: Response) {
  console.error("Stock movements API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

export const listStockMovements = async (req: Request, res: Response) => {
  const parsed = listStockMovementsQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid stock movement query parameters",
      details: parsed.error.issues,
    });
  }

  const {
    productId,
    type,
    startDate,
    endDate,
    limit = "20",
    offset = "0",
  } = parsed.data;

  const limitValue = Number(limit);
  const offsetValue = Number(offset);

  const dateFilter: Prisma.DateTimeFilter | undefined = (() => {
    if (!startDate && !endDate) {
      return undefined;
    }

    const where: Prisma.DateTimeFilter = {};

    if (startDate) {
      where.gte = normalizeDateRange(startDate).start;
    }

    if (endDate) {
      where.lte = normalizeDateRange(endDate).end;
    }

    return where;
  })();

  const where: Prisma.StockMovementWhereInput = {
    ...(productId ? { productId } : {}),
    ...(type ? { type } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  try {
    const [stockMovements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: movementInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limitValue,
        skip: offsetValue,
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return res.status(200).json({
      stockMovements,
      pagination: {
        limit: limitValue,
        offset: offsetValue,
        returned: stockMovements.length,
        total,
      },
    });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getStockMovementById = async (req: Request, res: Response) => {
  const parsed = stockMovementIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid stock movement id" });
  }

  try {
    const stockMovement = await prisma.stockMovement.findUnique({
      where: { id: parsed.data },
      include: movementInclude,
    });

    if (!stockMovement) {
      return res.status(404).json({ error: "Stock movement not found" });
    }

    return res.status(200).json({ stockMovement });
  } catch (error) {
    return handleError(error, res);
  }
};
