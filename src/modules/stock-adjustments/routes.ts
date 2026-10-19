import { Router } from "express";

import {
  createStockAdjustment,
  getStockAdjustmentById,
  listStockAdjustments,
} from "./controller.js";

export const stockAdjustmentsRouter = Router();

stockAdjustmentsRouter.get("/", listStockAdjustments);
stockAdjustmentsRouter.get("/:id", getStockAdjustmentById);
stockAdjustmentsRouter.post("/", createStockAdjustment);
