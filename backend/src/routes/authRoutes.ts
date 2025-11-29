import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { signup, login } from "../services/authService";
import { config } from "../config/env";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

const signToken = (user: { id: string; email: string }): string =>
  jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });

router.post(
  "/signup",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      const user = await signup(email, password);
      const token = signToken({ id: user._id.toString(), email: user.email });
      res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }
      const user = await login(email, password);
      const token = signToken({ id: user._id.toString(), email: user.email });
      res.json({ token, user: { id: user._id, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({ user: req.user });
    } catch (err) {
      next(err);
    }
  }
);

export const authRoutes = router;
