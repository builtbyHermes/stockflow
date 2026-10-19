
import express from "express";

import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./modules/auth/routes.js";
import { productsRouter } from "./modules/products/routes.js";
import { purchaseOrdersRouter } from "./modules/purchase-orders/routes.js";
import { stockAdjustmentsRouter } from "./modules/stock-adjustments/routes.js";
import { stockMovementsRouter } from "./modules/stock-movements/routes.js";
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

// Authentication endpoints remain public.
app.use("/api/auth", authRouter);

// All inventory endpoints require authentication.
app.use("/api/products", requireAuth, productsRouter);
app.use("/api/suppliers", requireAuth, suppliersRouter);
app.use("/api/purchase-orders", requireAuth, purchaseOrdersRouter);
app.use("/api/stock-adjustments", requireAuth, stockAdjustmentsRouter);
app.use("/api/stock-movements", requireAuth, stockMovementsRouter);
