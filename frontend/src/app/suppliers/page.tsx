"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { api, ApiError } from "@/lib/api";
import type { Supplier } from "@/types/api";

export default function SuppliersPage() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ suppliers: Supplier[] }>("/api/suppliers");
      setSuppliers(response.suppliers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const submitSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
    };

    try {
      if (editingId) {
        await api.patch<{ supplier: Supplier }>(`/api/suppliers/${editingId}`, payload);
        setSuccess("Supplier updated successfully.");
      } else {
        await api.post<{ supplier: Supplier }>("/api/suppliers", payload);
        setSuccess("Supplier created successfully.");
      }

      setForm({ name: "", email: "", phone: "", address: "" });
      setEditingId(null);
      await loadSuppliers();
    } catch (err) {
      if (err instanceof ApiError && err.data && typeof err.data === "object" && "details" in err.data) {
        const details = (err.data as { details?: Array<{ message?: string }> }).details ?? [];
        const message = details.map((item) => item.message ?? "Invalid value").join("; ");
        setError(message || err.message);
      } else {
        setError(err instanceof Error ? err.message : "Unable to save supplier.");
      }
    }
  };

  const editSupplier = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
    });
  };

  const deleteSupplier = async (supplierId: string) => {
    const confirmed = window.confirm("Delete this supplier? This soft-deletes it and requires ADMIN role.");
    if (!confirmed) return;

    try {
      await api.delete<{ supplier: Supplier; deleted: boolean }>(`/api/suppliers/${supplierId}`);
      setSuccess("Supplier deleted.");
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete supplier.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Partners</p>
          <h1>Suppliers</h1>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}
      {success ? <div className="message success">{success}</div> : null}

      <div className="card-grid two-up">
        <section className="panel">
          <h2>{editingId ? "Edit supplier" : "Create supplier"}</h2>
          <form onSubmit={submitSupplier} className="form-grid">
            <label className="full-width">
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              <span>Phone</span>
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            <label className="full-width">
              <span>Address</span>
              <textarea value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </label>
            <div className="button-row">
              <button className="button primary" type="submit">{editingId ? "Save supplier" : "Create supplier"}</button>
              {editingId ? (
                <button className="button secondary" type="button" onClick={() => { setEditingId(null); setForm({ name: "", email: "", phone: "", address: "" }); }}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Supplier list</h2>
          {loading ? <div className="message">Loading suppliers...</div> : null}
          {!loading && suppliers.length === 0 ? <div className="message">No active suppliers found.</div> : null}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.email ?? "—"}</td>
                    <td>{supplier.phone ?? "—"}</td>
                    <td>
                      <span className={supplier.isActive ? "status active" : "status inactive"}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button className="button secondary small" type="button" onClick={() => editSupplier(supplier)}>Edit</button>
                      {user?.role === "ADMIN" ? (
                        <button className="button danger small" type="button" onClick={() => deleteSupplier(supplier.id)}>Delete</button>
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
