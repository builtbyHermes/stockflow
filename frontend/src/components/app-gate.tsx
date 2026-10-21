"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";

export function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const publicPaths = ["/", "/login", "/register"];
  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user && !isPublicPath) {
      router.replace("/login");
      return;
    }

    if (user && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [ready, user, pathname, isPublicPath, router]);

  if (!ready) {
    return <div className="loading-shell">Checking session...</div>;
  }

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (!user) {
    return <div className="loading-shell">Redirecting to login...</div>;
  }

  return <AppShell>{children}</AppShell>;
}
