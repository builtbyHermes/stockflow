export type Role = "ADMIN" | "STAFF";

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: Role;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: string | number;
  costPrice: string | number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: string | number;
  product?: {
    id: string;
    sku: string;
    name: string;
    costPrice: string | number;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
    role: Role;
  };
  supplier?: Supplier;
  status: "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELED";
  notes: string | null;
  orderedAt: string | null;
  receivedAt: string | null;
  items: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  createdById: string;
  purchaseOrderId: string | null;
  type: "ADJUSTMENT";
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  createdAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    stockQuantity: number;
    isActive: boolean;
  };
  createdBy?: SessionUser;
}

export interface StockMovement {
  id: string;
  productId: string;
  createdById: string | null;
  purchaseOrderId: string | null;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN";
  quantityChange: number;
  quantityAfter: number;
  reason: string | null;
  unitCost: string | number | null;
  createdAt: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  purchaseOrder?: {
    id: string;
    orderNumber: string;
    status: string;
  };
}
