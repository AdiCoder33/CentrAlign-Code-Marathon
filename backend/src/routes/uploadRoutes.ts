import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { uploadImage } from "../services/uploadService";
import { MediaModel } from "../models/Media";
import { AuthRequest } from "../middleware/auth";
import jwt, { JwtPayload } from "jsonwebtoken";
import { config } from "../config/env";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const DEFAULT_MAX_MB = 5;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const attachUserIfPresent = (req: AuthRequest): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return;
  const parts = authHeader.split(" ");
  if (parts.length < 2) return;
  const token = parts[1];
  if (!token) return;
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as
      | JwtPayload
      | string;
    if (typeof decoded !== "string" && decoded.id && decoded.email) {
      req.user = { id: decoded.id as string, email: decoded.email as string };
    }
  } catch {
    // ignore invalid tokens for public upload
  }
};

router.post(
  "/image",
  upload.single("file"),
  // auth optional; we still try to read req.user if middleware ran upstream.
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      attachUserIfPresent(req);
      if (!req.file) {
        res.status(400).json({ message: "File is required" });
        return;
      }
      if (!ALLOWED_MIME.includes(req.file.mimetype)) {
        res.status(400).json({ message: "Unsupported file type" });
        return;
      }
      const sizeMB = req.file.size / (1024 * 1024);
      if (sizeMB > DEFAULT_MAX_MB) {
        res.status(400).json({ message: `File exceeds ${DEFAULT_MAX_MB}MB limit` });
        return;
      }
      const result = await uploadImage(req.file.buffer, req.file.originalname);
      await MediaModel.create({
        url: result.url,
        uploadedBy: req.user ? req.user.id : null,
        context: "submission",
      });
      res.json({ url: result.url });
    } catch (err) {
      next(err);
    }
  }
);

export const uploadRoutes = router;
