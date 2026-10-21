"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/purchase-orders", label: "Purchase Orders" },
  { href: "/stock-adjustments", label: "Stock Adjustments" },
  { href: "/stock-movements", label: "Stock Movements" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="brand-badge">S</div>
          <div>
            <div className="brand-name">StockFlow</div>
            <div className="brand-tag">Inventory API Tester</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="user-card">
            <div className="user-name">{user.name ?? "User"}</div>
            <div className="user-email">{user.email}</div>
            <div className="user-role">{user.role}</div>
            <button className="button secondary small" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        ) : null}
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  );
}
