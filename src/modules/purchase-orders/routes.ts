
import { Router } from "express";

import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  updatePurchaseOrder,
} from "./controller.js";

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/", listPurchaseOrders);
purchaseOrdersRouter.get("/:id", getPurchaseOrderById);
purchaseOrdersRouter.post("/", createPurchaseOrder);
purchaseOrdersRouter.patch("/:id/cancel", cancelPurchaseOrder);
purchaseOrdersRouter.patch("/:id", updatePurchaseOrder);
