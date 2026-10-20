
import type { ErrorRequestHandler } from "express";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { requireAuth } from "./middleware/auth.js";
import { authRouter } from "./modules/auth/routes.js";
import { productsRouter } from "./modules/products/routes.js";
import { purchaseOrdersRouter } from "./modules/purchase-orders/routes.js";
import { stockAdjustmentsRouter } from "./modules/stock-adjustments/routes.js";
import { stockMovementsRouter } from "./modules/stock-movements/routes.js";
import { suppliersRouter } from "./modules/suppliers/routes.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? false,
    credentials: true,
  }),
);
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

// Global error handler — must be the last middleware registered.
// Returns structured JSON for any unhandled exception so clients never
// receive an HTML stack trace or raw Express error page.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const status = typeof err.status === "number" ? err.status : 500;
  res.status(status).json({ error: "Internal server error" });
};

app.use(errorHandler);
