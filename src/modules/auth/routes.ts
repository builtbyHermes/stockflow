
import { Router } from "express";
import { getSession, login, logout, register } from "./controller.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/session", getSession);
authRouter.post("/logout", logout);
