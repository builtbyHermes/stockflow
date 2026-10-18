//functionalities(nussiness logi) for different endpoints
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  createSupplierSchema,
  supplierIdSchema,
  updateSupplierSchema,
} from "./schema.js";

function handleError(error: unknown, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Supplier not found" });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A supplier with these unique details already exists",
      });
    }
  }

  console.error("Suppliers API error:", error);

  return res.status(500).json({ error: "Internal server error" });
}

export const listSuppliers = async (_req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ suppliers });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  const parsed = supplierIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid supplier id" });
  }

  try {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: parsed.data,
        isActive: true,
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    return res.status(200).json({ supplier });
  } catch (error) {
    return handleError(error, res);
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  const parsed = createSupplierSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid supplier data",
      details: parsed.error.issues,
    });
  }

  try {
    const supplier = await prisma.supplier.create({
      data: parsed.data,
    });

    return res.status(201).json({ supplier });
  } catch (error) {
    return handleError(error, res);
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  const idResult = supplierIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ error: "Invalid supplier id" });
  }

  const parsed = updateSupplierSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid supplier data",
      details: parsed.error.issues,
    });
  }

  try {
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id: idResult.data,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const supplier = await prisma.supplier.update({
      where: { id: idResult.data },
      data: parsed.data,
    });

    return res.status(200).json({ supplier });
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  const parsed = supplierIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid supplier id" });
  }

  try {
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        id: parsed.data,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existingSupplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    const supplier = await prisma.supplier.update({
      where: { id: parsed.data },
      data: { isActive: false },
    });

    return res.status(200).json({
      supplier,
      deleted: true,
    });
  } catch (error) {
    return handleError(error, res);
  }
};
