import express from "express";

import { productsRouter } from "./modules/products/routes.js";
import { purchaseOrdersRouter } from "./modules/purchase-orders/routes.js";
import { stockAdjustmentsRouter } from "./modules/stock-adjustments/routes.js";
import { suppliersRouter } from "./modules/suppliers/routes.js";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to StockFlow API",
    status: "running",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/products", productsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/stock-adjustments", stockAdjustmentsRouter);
