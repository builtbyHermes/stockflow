import { Router } from "express";

import { requireRole } from "../../middleware/auth.js";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "./controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProducts);
productsRouter.get("/:id", getProductById);
productsRouter.post("/", createProduct);
productsRouter.patch("/:id", updateProduct);
productsRouter.delete("/:id", requireRole("ADMIN"), deleteProduct);
