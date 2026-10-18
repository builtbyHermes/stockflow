
import { Router } from "express";

import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
} from "./controller.js";

export const suppliersRouter = Router();

suppliersRouter.get("/", listSuppliers);
suppliersRouter.get("/:id", getSupplierById);
suppliersRouter.post("/", createSupplier);
suppliersRouter.patch("/:id", updateSupplier);
suppliersRouter.delete("/:id", deleteSupplier);
