
import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { prisma } from "../lib/prisma.js";

const SESSION_COOKIE = "stockflow_session";

export interface AuthenticatedUser {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "STAFF";
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

function getCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (key !== name) continue;

    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = getCookie(req, SESSION_COOKIE);

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        id: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }

      res.setHeader(
        "Set-Cookie",
        `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`,
      );

      return res.status(401).json({
        error: "Session expired or invalid.",
      });
    }

    req.authUser = session.user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export function requireRole(role: "ADMIN" | "STAFF") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (req.authUser.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }

    return next();
  };
}
