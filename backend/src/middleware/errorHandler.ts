import { NextFunction, Request, Response } from "express";

// Centralized error handler with consistent shape.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[error]", err);
  const status =
    (typeof err === "object" && err && "status" in err && Number((err as any).status)) ||
    (err instanceof Error && (err as any).status) ||
    400;
  const message = err instanceof Error ? err.message : "Internal Server Error";
  const details = typeof err === "object" && err && "details" in err ? (err as any).details : undefined;
  res.status(typeof status === "number" ? status : 400).json({ message, ...(details ? { details } : {}) });
};
