"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { Product, PurchaseOrder, Supplier } from "@/types/api";

const emptyItem = () => ({ productId: "", orderedQuantity: "1", unitCost: "0" });

export default function PurchaseOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    supplierId: "",
    notes: "",
    items: [emptyItem()],
  });
  const [receiveForm, setReceiveForm] = useState({
    items: [{ productId: "", receivedQuantity: "1" }],
  });

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersResponse, productsResponse, suppliersResponse] = await Promise.all([
        api.get<{ purchaseOrders: PurchaseOrder[] }>("/api/purchase-orders"),
        api.get<{ products: Product[] }>("/api/products"),
        api.get<{ suppliers: Supplier[] }>("/api/suppliers"),
      ]);

      setOrders(ordersResponse.purchaseOrders);
      setProducts(productsResponse.products);
      setSuppliers(suppliersResponse.suppliers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        supplierId: draft.supplierId,
        notes: draft.notes.trim() || null,
        items: draft.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId,
            orderedQuantity: Number(item.orderedQuantity),
            unitCost: Number(item.unitCost),
          })),
      };

      await api.post<{ purchaseOrder: PurchaseOrder }>("/api/purchase-orders", payload);
      setSuccess("Purchase order created as draft.");
      setDraft({ supplierId: "", notes: "", items: [emptyItem()] });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create purchase order.");
    }
  };

  const handleOrder = async (orderId: string) => {
    try {
      await api.patch<{ purchaseOrder: PurchaseOrder }>(`/api/purchase-orders/${orderId}/order`);
      setSuccess("Purchase order marked as ordered.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to order the purchase order.");
    }
  };

  const handleReceive = async (orderId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        items: receiveForm.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId,
            receivedQuantity: Number(item.receivedQuantity),
          })),
      };

      const result = await api.post<{ message: string; purchaseOrder: PurchaseOrder }>(
        `/api/purchase-orders/${orderId}/receive`,
        payload,
      );
      setSuccess(`${result.message} Status: ${result.purchaseOrder.status}`);
      setReceiveForm({ items: [{ productId: "", receivedQuantity: "1" }] });
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "details" in err.data) {
        setError((err.data as { details?: Array<{ message?: string }> }).details?.[0]?.message ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Unable to receive goods.");
      }
    }
  };

  const handleCancel = async (orderId: string) => {
    const confirmed = window.confirm("Cancel this purchase order? This requires admin permissions.");
    if (!confirmed) return;

    try {
      await api.patch<{ purchaseOrder: PurchaseOrder }>(`/api/purchase-orders/${orderId}/cancel`);
      setSuccess("Purchase order canceled.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to cancel purchase order.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Procurement</p>
          <h1>Purchase orders</h1>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {success ? <div className="message success">{success}</div> : null}

      <div className="card-grid two-up">
        <section className="panel">
          <h2>Create draft purchase order</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <label>
              <span>Supplier</span>
              <select value={draft.supplierId} onChange={(event) => setDraft({ ...draft, supplierId: event.target.value })}>
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </label>
            <label className="full-width">
              <span>Notes</span>
              <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
            </label>

            {draft.items.map((item, index) => (
              <div key={index} className="item-row">
                <select value={item.productId} onChange={(event) => {
                  const next = [...draft.items];
                  next[index] = { ...next[index], productId: event.target.value };
                  setDraft({ ...draft, items: next });
                }}>
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <input type="number" min="1" step="1" placeholder="Qty" value={item.orderedQuantity} onChange={(event) => {
                  const next = [...draft.items];
                  next[index] = { ...next[index], orderedQuantity: event.target.value };
                  setDraft({ ...draft, items: next });
                }} />
                <input type="number" min="0" step="0.01" placeholder="Unit cost" value={item.unitCost} onChange={(event) => {
                  const next = [...draft.items];
                  next[index] = { ...next[index], unitCost: event.target.value };
                  setDraft({ ...draft, items: next });
                }} />
              </div>
            ))}

            <div className="button-row">
              <button type="button" className="button secondary" onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}>Add item</button>
              <button className="button primary" type="submit">Create draft order</button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Receive against order</h2>
          {selectedOrder ? (
            <>
              <div className="order-header">
                <strong>{selectedOrder.orderNumber}</strong>
                <span className={`status ${selectedOrder.status.toLowerCase().replace(/_/g, "-")}`}>{selectedOrder.status}</span>
              </div>

              {selectedOrder.items.map((item) => (
                <div key={item.id} className="mini-row">
                  <span>{item.product?.name ?? item.productId}</span>
                  <span>Remaining: {Math.max(item.orderedQuantity - item.receivedQuantity, 0)}</span>
                </div>
              ))}

              {receiveForm.items.map((item, index) => (
                <div key={index} className="item-row">
                  <select value={item.productId} onChange={(event) => {
                    const next = [...receiveForm.items];
                    next[index] = { ...next[index], productId: event.target.value };
                    setReceiveForm({ ...receiveForm, items: next });
                  }}>
                    <option value="">Select product</option>
                    {selectedOrder.items.map((orderItem) => (
                      <option key={orderItem.productId} value={orderItem.productId}>{orderItem.product?.name ?? orderItem.productId}</option>
                    ))}
                  </select>
                  <input type="number" min="1" step="1" placeholder="Receive qty" value={item.receivedQuantity} onChange={(event) => {
                    const next = [...receiveForm.items];
                    next[index] = { ...next[index], receivedQuantity: event.target.value };
                    setReceiveForm({ ...receiveForm, items: next });
                  }} />
                </div>
              ))}

              <div className="button-row">
                <button type="button" className="button secondary" onClick={() => setReceiveForm({ items: [...receiveForm.items, { productId: "", receivedQuantity: "1" }] })}>Add receipt item</button>
                <button type="button" className="button primary" onClick={() => handleReceive(selectedOrder.id)}>Receive</button>
              </div>
            </>
          ) : (
            <div className="message">Select an order from the list to receive items.</div>
          )}
        </section>
      </div>

      <section className="panel table-panel">
        <h2>Orders</h2>
        {loading ? <div className="message">Loading purchase orders...</div> : null}
        {!loading && orders.length === 0 ? <div className="message">No purchase orders found.</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{order.supplier?.name ?? order.supplierId}</td>
                  <td>
                    <span className={`status ${order.status.toLowerCase().replace(/_/g, "-")}`}>{order.status}</span>
                  </td>
                  <td>{order.items.length}</td>
                  <td className="actions-cell">
                    <button className="button secondary small" type="button" onClick={() => setSelectedOrderId(order.id)}>Select</button>
                    {order.status === "DRAFT" ? (
                      <button className="button primary small" type="button" onClick={() => handleOrder(order.id)}>Order</button>
                    ) : null}
                    {user?.role === "ADMIN" && (order.status === "DRAFT" || order.status === "ORDERED") ? (
                      <button className="button danger small" type="button" onClick={() => handleCancel(order.id)}>Cancel</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
