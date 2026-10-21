"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { StockMovement } from "@/types/api";

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get<{ stockMovements: StockMovement[]; pagination: { total: number } }>(
          "/api/stock-movements?limit=20",
        );
        setMovements(response.stockMovements);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load stock movements.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Audit trail</p>
          <h1>Stock movements</h1>
        </div>
      </div>

      {error ? <div className="message error">{error}</div> : null}

      <section className="panel table-panel">
        {loading ? <div className="message">Loading stock movements...</div> : null}
        {!loading && movements.length === 0 ? <div className="message">No stock movement history found.</div> : null}
        {!loading && movements.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Change</th>
                  <th>After</th>
                  <th>Reason</th>
                  <th>PO</th>
                  <th>User</th>
                  <th>At</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.type}</td>
                    <td>{movement.product?.name ?? movement.productId}</td>
                    <td>{movement.quantityChange}</td>
                    <td>{movement.quantityAfter}</td>
                    <td>{movement.reason ?? "—"}</td>
                    <td>{movement.purchaseOrder?.orderNumber ?? "—"}</td>
                    <td>{movement.createdBy?.name ?? movement.createdBy?.email ?? "—"}</td>
                    <td>{new Date(movement.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
