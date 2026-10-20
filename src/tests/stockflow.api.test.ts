import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { app } from "../app.js";
import { prisma } from "../lib/prisma.js";

const dbDescribe = describe;

const makeUniqueSuffix = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const suffix = makeUniqueSuffix();
const adminEmail = `admin.${suffix}@stockflow.test`;
const staffEmail = `staff.${suffix}@stockflow.test`;
const adminPassword = "TestAdminPass123!";
const staffPassword = "TestStaffPass123!";

const productIds: string[] = [];
const orderIds: string[] = [];
const supplierIds: string[] = [];
const userIds: string[] = [];

async function createUser(email: string, name: string, password: string, role: "ADMIN" | "STAFF") {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role,
    },
  });

  userIds.push(user.id);
  return user;
}

async function createSupplier(name: string) {
  const supplier = await prisma.supplier.create({
    data: {
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.test`,
      phone: "+15550000000",
      address: "Test Street",
    },
  });

  supplierIds.push(supplier.id);
  return supplier;
}

async function createProduct(payload: {
  sku: string;
  name: string;
  description?: string;
  price: number;
  costPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
}) {
  const product = await prisma.product.create({
    data: {
      sku: payload.sku,
      name: payload.name,
      description: payload.description ?? "Test product",
      price: payload.price,
      costPrice: payload.costPrice,
      stockQuantity: payload.stockQuantity ?? 0,
      reorderLevel: payload.reorderLevel ?? 1,
    },
  });

  productIds.push(product.id);
  return product;
}

async function cleanup() {
  for (const orderId of orderIds) {
    await prisma.stockMovement.deleteMany({ where: { purchaseOrderId: orderId } }).catch(() => undefined);
    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: orderId } }).catch(() => undefined);
    await prisma.purchaseOrder.delete({ where: { id: orderId } }).catch(() => undefined);
  }

  for (const productId of productIds) {
    await prisma.stockMovement.deleteMany({ where: { productId } }).catch(() => undefined);
    await prisma.product.delete({ where: { id: productId } }).catch(() => undefined);
  }

  for (const supplierId of supplierIds) {
    await prisma.supplier.delete({ where: { id: supplierId } }).catch(() => undefined);
  }

  for (const userId of userIds) {
    await prisma.session.deleteMany({ where: { userId } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
  }
}

beforeAll(async () => {
  await createUser(adminEmail, "Test Admin", adminPassword, "ADMIN");
  await createUser(staffEmail, "Test Staff", staffPassword, "STAFF");
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

dbDescribe("StockFlow API authentication", () => {
  it("logs in successfully and returns the authenticated user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: adminEmail,
        password: adminPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Login successful.");
    expect(res.body.user.email).toBe(adminEmail);
    expect(res.body.user.role).toBe("ADMIN");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: adminEmail,
        password: "wrong-password",
      });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: "Invalid email or password." });
  });

  it("retrieves the current session and rejects unauthenticated access to protected routes", async () => {
    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const sessionRes = await adminAgent.get("/api/auth/session");
    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.authenticated).toBe(true);
    expect(sessionRes.body.user.email).toBe(adminEmail);

    const unauthRes = await request(app).get("/api/products");
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.error).toBe("Authentication required.");
  });

  it("invalidates the session on logout", async () => {
    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const logoutRes = await adminAgent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe("Logout successful.");

    const sessionRes = await adminAgent.get("/api/auth/session");
    expect(sessionRes.status).toBe(401);
  });

  it("rejects staff from admin-only operations", async () => {
    const staffAgent = request.agent(app);
    await staffAgent.post("/api/auth/login").send({
      email: staffEmail,
      password: staffPassword,
    });

    const product = await createProduct({
      sku: `ADMIN-ROLE-${suffix}`,
      name: "Admin role product",
      price: 5,
      costPrice: 2,
    });

    const res = await staffAgent.delete(`/api/products/${product.id}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Insufficient permissions.");
  });
});

dbDescribe("StockFlow products and suppliers", () => {
  it("valid product and supplier requests succeed while invalid payloads are rejected", async () => {
    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const supplier = await createSupplier(`Supplier Validation ${makeUniqueSuffix()}`);
    const productRes = await adminAgent.post("/api/products").send({
      sku: `VALID-PRODUCT-${makeUniqueSuffix()}`,
      name: "Valid Product",
      description: "Test product",
      price: 20,
      costPrice: 15,
      reorderLevel: 1,
    });

    expect(productRes.status).toBe(201);
    expect(productRes.body.product.name).toBe("Valid Product");

    const invalidProductRes = await adminAgent.post("/api/products").send({
      sku: "",
      name: "",
      price: -1,
    });

    expect(invalidProductRes.status).toBe(400);

    const duplicateSkuRes = await adminAgent.post("/api/products").send({
      sku: productRes.body.product.sku,
      name: "Duplicate product",
      description: "Should fail",
      price: 9,
      costPrice: 7,
      reorderLevel: 1,
    });

    expect(duplicateSkuRes.status).toBe(409);

    const supplierRes = await adminAgent.post("/api/suppliers").send({
      name: `Supplier ${suffix}`,
      email: `supplier.${suffix}@example.test`,
      phone: "+15550001111",
      address: "Supplier Street",
    });

    expect(supplierRes.status).toBe(201);
    expect(supplierRes.body.supplier.name).toBe(`Supplier ${suffix}`);

    const missingSupplierRes = await adminAgent.get(`/api/suppliers/${supplier.id}x`);
    expect(missingSupplierRes.status).toBe(400);
  });
});

dbDescribe("Purchase orders and receiving", () => {
  it("creates, orders, partially receives, and completes the final receive without exceeding the order", async () => {
    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const supplier = await createSupplier(`PO Supplier ${makeUniqueSuffix()}`);
    const product = await createProduct({
      sku: `PO-RECEIVE-${makeUniqueSuffix()}`,
      name: "Receive Product",
      price: 120,
      costPrice: 80,
      stockQuantity: 0,
    });

    const createPoRes = await adminAgent.post("/api/purchase-orders").send({
      supplierId: supplier.id,
      notes: "Receipt verification",
      items: [
        {
          productId: product.id,
          orderedQuantity: 4,
          unitCost: 80,
        },
      ],
    });

    expect(createPoRes.status).toBe(201);
    const purchaseOrderId = createPoRes.body.purchaseOrder.id;
    orderIds.push(purchaseOrderId);

    const orderedRes = await adminAgent.patch(`/api/purchase-orders/${purchaseOrderId}/order`);
    expect(orderedRes.status).toBe(200);
    expect(orderedRes.body.purchaseOrder.status).toBe("ORDERED");

    const partialRes = await adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
      items: [{ productId: product.id, receivedQuantity: 2 }],
    });

    expect(partialRes.status).toBe(200);
    expect(partialRes.body.purchaseOrder.status).toBe("PARTIALLY_RECEIVED");
    expect(partialRes.body.purchaseOrder.items[0].receivedQuantity).toBe(2);

    const remainingRes = await adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
      items: [{ productId: product.id, receivedQuantity: 2 }],
    });

    expect(remainingRes.status).toBe(200);
    expect(remainingRes.body.purchaseOrder.status).toBe("RECEIVED");
    expect(remainingRes.body.purchaseOrder.items[0].receivedQuantity).toBe(4);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stockQuantity).toBe(4);

    const stockMovements = await prisma.stockMovement.findMany({
      where: { purchaseOrderId },
      orderBy: { createdAt: "asc" },
    });

    expect(stockMovements.length).toBeGreaterThan(0);
    expect(stockMovements.reduce((total, movement) => total + movement.quantityChange, 0)).toBe(4);
    expect(stockMovements.at(-1)?.createdById).toBeDefined();
  });

  it("rejects over-receive, invalid quantities, and canceled order receipts without mutating stock", async () => {
    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const supplier = await createSupplier(`Blocked Receive Supplier ${makeUniqueSuffix()}`);
    const product = await createProduct({
      sku: `REJECT-RECEIVE-${makeUniqueSuffix()}`,
      name: "Rejected Receive Product",
      price: 30,
      costPrice: 20,
      stockQuantity: 0,
    });

    const poRes = await adminAgent.post("/api/purchase-orders").send({
      supplierId: supplier.id,
      items: [{ productId: product.id, orderedQuantity: 3, unitCost: 20 }],
    });

    const purchaseOrderId = poRes.body.purchaseOrder.id;
    orderIds.push(purchaseOrderId);

    await adminAgent.patch(`/api/purchase-orders/${purchaseOrderId}/order`);

    const invalidQuantityRes = await adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
      items: [{ productId: product.id, receivedQuantity: 0 }],
    });
    expect(invalidQuantityRes.status).toBe(400);

    const partialProductBefore = await prisma.product.findUnique({ where: { id: product.id } });
    expect(partialProductBefore?.stockQuantity).toBe(0);

    const overRes = await adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
      items: [{ productId: product.id, receivedQuantity: 5 }],
    });
    expect(overRes.status).toBe(409);

    const productAfterBadReceive = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfterBadReceive?.stockQuantity).toBe(0);

    const cancelRes = await adminAgent.patch(`/api/purchase-orders/${purchaseOrderId}/cancel`);
    expect(cancelRes.status).toBe(200);

    const canceledReceiveRes = await adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
      items: [{ productId: product.id, receivedQuantity: 1 }],
    });
    expect(canceledReceiveRes.status).toBe(409);

    const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(finalProduct?.stockQuantity).toBe(0);

    const finalMovementCount = await prisma.stockMovement.count({ where: { productId: product.id } });
    expect(finalMovementCount).toBe(0);
  });
});

dbDescribe("Stock adjustments and movement history", () => {
  it("records valid adjustments and rejects invalid negative stock changes", async () => {
    const adminAgent = request.agent(app);
    const staffAgent = request.agent(app);

    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });
    await staffAgent.post("/api/auth/login").send({
      email: staffEmail,
      password: staffPassword,
    });

    const product = await createProduct({
      sku: `ADJUST-${makeUniqueSuffix()}`,
      name: "Adjustment Test Product",
      price: 50,
      costPrice: 30,
      stockQuantity: 2,
    });

    const positiveRes = await adminAgent.post("/api/stock-adjustments").send({
      productId: product.id,
      quantityChange: 3,
      reason: "Restock for verification",
    });

    expect(positiveRes.status).toBe(201);
    expect(positiveRes.body.product.stockQuantity).toBe(5);
    expect(positiveRes.body.adjustment.createdBy.email).toBe(adminEmail);

    const negativeRes = await staffAgent.post("/api/stock-adjustments").send({
      productId: product.id,
      quantityChange: -10,
      reason: "Should fail",
    });

    expect(negativeRes.status).toBe(409);
    expect(negativeRes.body.error).toBe("Adjustment would make stock quantity negative");

    const invalidInputRes = await staffAgent.post("/api/stock-adjustments").send({
      productId: product.id,
      quantityChange: 0,
      reason: "",
    });

    expect(invalidInputRes.status).toBe(400);

    const movement = await prisma.stockMovement.findFirst({
      where: { productId: product.id, type: "ADJUSTMENT" },
      orderBy: { createdAt: "desc" },
    });

    expect(movement?.quantityChange).toBe(3);
    expect(movement?.quantityAfter).toBe(5);
  });
});

dbDescribe("Concurrent receiving safety", () => {
  it("does not over-receive or double-apply stock when two valid receipt requests hit the same order concurrently", async () => {
    const supplier = await createSupplier(`Concurrent Supplier ${makeUniqueSuffix()}`);
    const product = await createProduct({
      sku: `CONCURRENT-${makeUniqueSuffix()}`,
      name: "Concurrent Product",
      price: 25,
      costPrice: 18,
      stockQuantity: 0,
    });

    const adminAgent = request.agent(app);
    await adminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const createPoRes = await adminAgent.post("/api/purchase-orders").send({
      supplierId: supplier.id,
      notes: "Concurrent verification",
      items: [{ productId: product.id, orderedQuantity: 3, unitCost: 18 }],
    });

    const purchaseOrderId = createPoRes.body.purchaseOrder.id;
    orderIds.push(purchaseOrderId);

    await adminAgent.patch(`/api/purchase-orders/${purchaseOrderId}/order`);

    const secondAdminAgent = request.agent(app);
    await secondAdminAgent.post("/api/auth/login").send({
      email: adminEmail,
      password: adminPassword,
    });

    const [firstRes, secondRes] = await Promise.all([
      adminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
        items: [{ productId: product.id, receivedQuantity: 2 }],
      }),
      secondAdminAgent.post(`/api/purchase-orders/${purchaseOrderId}/receive`).send({
        items: [{ productId: product.id, receivedQuantity: 2 }],
      }),
    ]);

    const finalOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    const finalProduct = await prisma.product.findUnique({ where: { id: product.id } });
    const finalMovements = await prisma.stockMovement.findMany({
      where: { purchaseOrderId },
    });

    const successfulStatuses = [firstRes.status, secondRes.status].filter((status) => status === 200);
    const successfulTotal = finalMovements.reduce((total, movement) => total + movement.quantityChange, 0);

    expect(finalOrder?.items[0]?.receivedQuantity).toBeLessThanOrEqual(3);
    expect(finalProduct?.stockQuantity).toBe(finalOrder?.items[0]?.receivedQuantity ?? 0);
    expect(successfulStatuses.length).toBeGreaterThanOrEqual(1);
    expect(successfulTotal).toBe(finalOrder?.items[0]?.receivedQuantity ?? 0);
    expect(finalOrder?.status === "PARTIALLY_RECEIVED" || finalOrder?.status === "RECEIVED").toBe(true);
  });
});
