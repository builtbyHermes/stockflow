import { Router } from "express";

import {
  getStockMovementById,
  listStockMovements,
} from "./controller.js";

export const stockMovementsRouter = Router();

stockMovementsRouter.get("/", listStockMovements);
stockMovementsRouter.get("/:id", getStockMovementById);
