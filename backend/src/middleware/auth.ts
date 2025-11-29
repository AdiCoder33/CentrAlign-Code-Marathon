import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { JwtUser } from "../types";
import { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: JwtUser;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === "string") {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    const payload = decoded as Partial<JwtUser> & JwtPayload;
    if (!payload.id || !payload.email) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }
    req.user = { id: String(payload.id), email: String(payload.email) };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
