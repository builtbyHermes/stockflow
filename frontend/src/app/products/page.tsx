"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { Product } from "@/types/api";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    costPrice: "",
    stockQuantity: "0",
    reorderLevel: "10",
    isActive: true,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ products: Product[] }>("/api/products");
      setProducts(response.products);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const submitProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      stockQuantity: Number(form.stockQuantity),
      reorderLevel: Number(form.reorderLevel),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await api.patch<{ product: Product }>(`/api/products/${editingId}`, {
          sku: payload.sku,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          costPrice: payload.costPrice,
          reorderLevel: payload.reorderLevel,
        });
        setSuccess("Product updated successfully.");
      } else {
        await api.post<{ product: Product }>("/api/products", payload);
        setSuccess("Product created successfully.");
      }

      setForm({
        sku: "",
        name: "",
        description: "",
        price: "",
        costPrice: "",
        stockQuantity: "0",
        reorderLevel: "10",
        isActive: true,
      });
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "details" in err.data) {
        const details = (err.data as { details?: Array<{ message?: string }> }).details ?? [];
        const message = details.map((item) => item.message ?? "Invalid value").join("; ");
        setError(message || err.message);
      } else {
        setError(err instanceof Error ? err.message : "Unable to save the product.");
      }
    }
  };

  const deleteProduct = async (productId: string) => {
    const confirmed = window.confirm("Delete this product? This soft-deletes it and requires ADMIN role.");
    if (!confirmed) return;

    try {
      await api.delete<{ product: Product; deleted: boolean }>(`/api/products/${productId}`);
      setSuccess("Product deleted.");
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    }
  };

  const editProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      costPrice: String(product.costPrice),
      stockQuantity: String(product.stockQuantity),
      reorderLevel: String(product.reorderLevel),
      isActive: product.isActive,
    });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1>Products</h1>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {success ? <div className="message success">{success}</div> : null}

      <div className="card-grid two-up">
        <section className="panel">
          <h2>{editingId ? "Edit product" : "Create product"}</h2>
          <form onSubmit={submitProduct} className="form-grid">
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} />
            </label>
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="full-width">
              <span>Description</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
            <label>
              <span>Price</span>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </label>
            <label>
              <span>Cost price</span>
              <input type="number" min="0" step="0.01" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} />
            </label>
            <label>
              <span>Stock quantity</span>
              <input type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })} />
            </label>
            <label>
              <span>Reorder level</span>
              <input type="number" min="0" step="1" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
              <span>Active</span>
            </label>

            <div className="button-row">
              <button className="button primary" type="submit">{editingId ? "Save changes" : "Create product"}</button>
              {editingId ? (
                <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm({ sku: "", name: "", description: "", price: "", costPrice: "", stockQuantity: "0", reorderLevel: "10", isActive: true }); }}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Product list</h2>
          {loading ? <div className="message">Loading products...</div> : null}
          {!loading && products.length === 0 ? <div className="message">No active products found.</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.sku}</td>
                    <td>{product.stockQuantity}</td>
                    <td>{Number(product.price || 0).toFixed(2)}</td>
                    <td>
                      <span className={product.isActive ? "status active" : "status inactive"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="button secondary small" type="button" onClick={() => editProduct(product)}>Edit</button>
                      {user?.role === "ADMIN" ? (
                        <button className="button danger small" type="button" onClick={() => deleteProduct(product.id)}>Delete</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
