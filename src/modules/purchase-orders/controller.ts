
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  createPurchaseOrderSchema,
  purchaseOrderIdSchema,
  updatePurchaseOrderSchema,
} from "./schema.js";

const orderInclude = {
  supplier: true,
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          costPrice: true,
        },
      },
    },
  },
} satisfies Prisma.PurchaseOrderInclude;

function handleError(error: unknown, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A record with a conflicting unique value already exists",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        error: "A referenced record does not exist",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Purchase order not found" });
    }
  }

  console.error("Purchase Orders API error:", error);
  return res.status(500).json({ error: "Internal server error" });
}

async function getDevelopmentUserId(res: Response) {
  const userId = process.env.STOCKFLOW_DEV_USER_ID;

  if (!userId) {
    res.status(503).json({
      error:
        "Purchase order creation is not configured. Set STOCKFLOW_DEV_USER_ID in .env.",
    });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    res.status(503).json({
      error:
        "The configured development user does not exist. Check STOCKFLOW_DEV_USER_ID.",
    });
    return null;
  }

  return user.id;
}

async function validateActiveSupplier(supplierId: string) {
  return prisma.supplier.findFirst({
    where: { id: supplierId, isActive: true },
    select: { id: true },
  });
}

async function validateActiveProducts(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    select: { id: true },
  });

  return products.length === new Set(productIds).size;
}

export const listPurchaseOrders = async (
  _req: Request,
  res: Response,
) => {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ purchaseOrders });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getPurchaseOrderById = async (
  req: Request,
  res: Response,
) => {
  const parsed = purchaseOrderIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid purchase order id" });
  }

  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: parsed.data },
      include: orderInclude,
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    return res.status(200).json({ purchaseOrder });
  } catch (error) {
    return handleError(error, res);
  }
};

export const createPurchaseOrder = async (
  req: Request,
  res: Response,
) => {
  const parsed = createPurchaseOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid purchase order data",
      details: parsed.error.issues,
    });
  }

  try {
    const createdById = await getDevelopmentUserId(res);

    if (!createdById) {
      return;
    }

    const supplier = await validateActiveSupplier(parsed.data.supplierId);

    if (!supplier) {
      return res.status(400).json({
        error: "Supplier not found or inactive",
      });
    }

    const productIds = parsed.data.items.map((item) => item.productId);
    const productsAreValid = await validateActiveProducts(productIds);

    if (!productsAreValid) {
      return res.status(400).json({
        error: "One or more products do not exist or are inactive",
      });
    }

    const orderNumber =
      `PO-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId: parsed.data.supplierId,
        createdById,
        notes: parsed.data.notes ?? null,
        items: {
          create: parsed.data.items.map((item) => ({
            productId: item.productId,
            orderedQuantity: item.orderedQuantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: orderInclude,
    });

    return res.status(201).json({ purchaseOrder });
  } catch (error) {
    return handleError(error, res);
  }
};

export const updatePurchaseOrder = async (
  req: Request,
  res: Response,
) => {
  const idResult = purchaseOrderIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ error: "Invalid purchase order id" });
  }

  const parsed = updatePurchaseOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid purchase order data",
      details: parsed.error.issues,
    });
  }

  try {
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: idResult.data },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    if (existingOrder.status !== "DRAFT") {
      return res.status(409).json({
        error: "Only draft purchase orders can be updated",
      });
    }

    if (parsed.data.supplierId) {
      const supplier = await validateActiveSupplier(parsed.data.supplierId);

      if (!supplier) {
        return res.status(400).json({
          error: "Supplier not found or inactive",
        });
      }
    }

    if (parsed.data.items) {
      const productIds = parsed.data.items.map((item) => item.productId);
      const productsAreValid = await validateActiveProducts(productIds);

      if (!productsAreValid) {
        return res.status(400).json({
          error: "One or more products do not exist or are inactive",
        });
      }
    }

    const updateData: {
      supplierId?: string;
      notes?: string | null;
    } = {};

    if (parsed.data.supplierId !== undefined) {
      updateData.supplierId = parsed.data.supplierId;
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    const purchaseOrder = await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: idResult.data },
        data: updateData,
      });

      if (parsed.data.items !== undefined) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: idResult.data },
        });

        await tx.purchaseOrderItem.createMany({
          data: parsed.data.items.map((item) => ({
            purchaseOrderId: idResult.data,
            productId: item.productId,
            orderedQuantity: item.orderedQuantity,
            unitCost: item.unitCost,
          })),
        });
      }

      return tx.purchaseOrder.findUniqueOrThrow({
        where: { id: idResult.data },
        include: orderInclude,
      });
    });

    return res.status(200).json({ purchaseOrder });
  } catch (error) {
    return handleError(error, res);
  }
};

export const cancelPurchaseOrder = async (
  req: Request,
  res: Response,
) => {
  const parsed = purchaseOrderIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid purchase order id" });
  }

  try {
    const result = await prisma.purchaseOrder.updateMany({
      where: {
        id: parsed.data,
        status: { in: ["DRAFT", "ORDERED"] },
      },
      data: { status: "CANCELED" },
    });

    if (result.count === 0) {
      const existingOrder = await prisma.purchaseOrder.findUnique({
        where: { id: parsed.data },
        select: { id: true, status: true },
      });

      if (!existingOrder) {
        return res.status(404).json({
          error: "Purchase order not found",
        });
      }

      return res.status(409).json({
        error: `A purchase order with status ${existingOrder.status} cannot be canceled`,
      });
    }

    const purchaseOrder = await prisma.purchaseOrder.findUniqueOrThrow({
      where: { id: parsed.data },
      include: orderInclude,
    });

    return res.status(200).json({ purchaseOrder });
  } catch (error) {
    return handleError(error, res);
  }
};
