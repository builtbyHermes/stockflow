
import { Router } from "express";

import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  markPurchaseOrderAsOrdered,
  receivePurchaseOrder,
  updatePurchaseOrder,
} from "./controller.js";

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/", listPurchaseOrders);
purchaseOrdersRouter.get("/:id", getPurchaseOrderById);
purchaseOrdersRouter.post("/", createPurchaseOrder);

purchaseOrdersRouter.patch("/:id/order", markPurchaseOrderAsOrdered);
purchaseOrdersRouter.post("/:id/receive", receivePurchaseOrder);
purchaseOrdersRouter.patch("/:id/cancel", cancelPurchaseOrder);
purchaseOrdersRouter.patch("/:id", updatePurchaseOrder);
