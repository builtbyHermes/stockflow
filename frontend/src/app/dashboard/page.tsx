
"use client";

import Link from "next/link";

import { useAuth } from "@/components/auth-provider";

const sections = [
  {
    href: "/products",
    title: "Products",
    description: "Create, inspect, update, and test product management.",
  },
  {
    href: "/suppliers",
    title: "Suppliers",
    description: "Test supplier records and their API operations.",
  },
  {
    href: "/purchase-orders",
    title: "Purchase Orders",
    description: "Test order creation, ordering, receiving, and cancellation.",
  },
  {
    href: "/stock-adjustments",
    title: "Stock Adjustments",
    description: "Test inventory corrections and adjustment records.",
  },
  {
    href: "/stock-movements",
    title: "Stock Movements",
    description: "Inspect the recorded inventory movement history.",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>
            Welcome back, {user?.name || user?.email || "user"}.
          </p>
        </div>

        <span className="pill">{user?.role ?? "Authenticated"}</span>
      </header>

      <section className="panel">
        <p className="eyebrow">Testing workspace</p>
        <h2 style={{ marginBottom: 8 }}>StockFlow API tester</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
          Use this frontend to exercise the existing StockFlow backend through
          its API endpoints. The data displayed on each section should come
          from the backend, so you can verify the results of your operations.
        </p>
      </section>

      <section>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow">API modules</p>
            <h2>Choose a section</h2>
          </div>
        </div>

        <div className="card-grid two-up">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="panel"
              style={{ display: "block" }}
            >
              <h2 style={{ marginBottom: 8 }}>{section.title}</h2>
              <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                {section.description}
              </p>
              <p
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  marginTop: 16,
                }}
              >
                Open section →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
