
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "./schema.js";

function handleError(error: unknown, res: Response) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "A product with this SKU already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Product not found" });
    }
  }

  console.error("Products API error:", error);

  return res.status(500).json({ error: "Internal server error" });
}

export const listProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ products });
  } catch (error) {
    return handleError(error, res);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const parsed = productIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const product = await prisma.product.findFirst({
      where: {
        id: parsed.data,
        isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json({ product });
  } catch (error) {
    return handleError(error, res);
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const parsed = createProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid product data",
      details: parsed.error.issues,
    });
  }

  try {
    const product = await prisma.product.create({
      data: parsed.data,
    });

    return res.status(201).json({ product });
  } catch (error) {
    return handleError(error, res);
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const idResult = productIdSchema.safeParse(req.params.id);

  if (!idResult.success) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  const parsed = updateProductSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid product data",
      details: parsed.error.issues,
    });
  }

  try {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: idResult.data,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = await prisma.product.update({
      where: { id: idResult.data },
      data: parsed.data,
    });

    return res.status(200).json({ product });
  } catch (error) {
    return handleError(error, res);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const parsed = productIdSchema.safeParse(req.params.id);

  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid product id" });
  }

  try {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: parsed.data,
        isActive: true,
      },
      select: { id: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = await prisma.product.update({
      where: { id: parsed.data },
      data: { isActive: false },
    });

    return res.status(200).json({
      product,
      deleted: true,
    });
  } catch (error) {
    return handleError(error, res);
  }
};
