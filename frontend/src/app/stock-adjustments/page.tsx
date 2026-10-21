"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Product, StockAdjustment } from "@/types/api";

export default function StockAdjustmentsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    productId: "",
    quantityChange: "1",
    reason: "Inventory correction",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsResponse, adjustmentsResponse] = await Promise.all([
        api.get<{ products: Product[] }>("/api/products"),
        api.get<{ adjustments: StockAdjustment[]; pagination: { total: number } }>("/api/stock-adjustments"),
      ]);

      setProducts(productsResponse.products);
      setAdjustments(adjustmentsResponse.adjustments);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stock adjustments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const result = await api.post<{ product: Product; adjustment: StockAdjustment }>("/api/stock-adjustments", {
        productId: form.productId,
        quantityChange: Number(form.quantityChange),
        reason: form.reason,
      });

      setSuccess(`Adjustment posted successfully. New quantity: ${result.product.stockQuantity}`);
      setForm({ productId: "", quantityChange: "1", reason: "Inventory correction" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create adjustment.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory corrections</p>
          <h1>Stock adjustments</h1>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {success ? <div className="message success">{success}</div> : null}

      <div className="card-grid two-up">
        <section className="panel">
          <h2>Create adjustment</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              <span>Product</span>
              <select value={form.productId} onChange={(event) => setForm({ ...form, productId: event.target.value })}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Quantity change</span>
              <input type="number" step="1" value={form.quantityChange} onChange={(event) => setForm({ ...form, quantityChange: event.target.value })} />
            </label>
            <label className="full-width">
              <span>Reason</span>
              <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
            </label>
            <button className="button primary" type="submit">Create adjustment</button>
          </form>
        </section>

        <section className="panel">
          <h2>Recent adjustments</h2>
          {loading ? <div className="message">Loading adjustments...</div> : null}
          {!loading && adjustments.length === 0 ? <div className="message">No adjustments found.</div> : null}
          <div className="stack-list compact">
            {adjustments.slice(0, 8).map((adjustment) => (
              <div key={adjustment.id} className="mini-row">
                <span>{adjustment.product?.name ?? adjustment.productId}</span>
                <span>{adjustment.quantityChange > 0 ? "+" : ""}{adjustment.quantityChange}</span>
                <span>{adjustment.reason}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
