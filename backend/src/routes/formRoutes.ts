import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { createForm, getFormById, getUserForms } from "../services/formService";
import { Types } from "mongoose";
import { aiLimiter } from "../middleware/rateLimit";
import { SubmissionModel } from "../models/Submission";

const router = Router();

router.post(
  "/generate",
  aiLimiter,
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { prompt, useMemory } = req.body;
      if (!prompt) {
        res.status(400).json({ message: "Prompt is required" });
        return;
      }
      const { form, source } = await createForm(
        new Types.ObjectId(req.user!.id),
        prompt,
        { useMemory: useMemory !== false }
      );
      res.json({ form, source });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const ownerId = new Types.ObjectId(req.user.id);
      const forms = await getUserForms(ownerId);
      const counts = await SubmissionModel.aggregate([
        { $match: { userId: ownerId } },
        { $group: { _id: "$formId", count: { $sum: 1 } } },
      ]);
      const countMap = new Map<string, number>(
        counts.map((c) => [String(c._id), c.count as number])
      );
      const result = forms.map((form) => ({
        ...form.toObject(),
        submissionCount: countMap.get(form._id.toString()) || 0,
      }));
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "Form id is required" });
        return;
      }
      const form = await getFormById(id);
      if (!form) {
        res.status(404).json({ message: "Form not found" });
        return;
      }
      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/reference-media",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const { id } = req.params;
      const { url, urls } = req.body as { url?: string; urls?: string[] };
      const targetUrls = urls || (url ? [url] : []);
      if (!id || targetUrls.length === 0) {
        res.status(400).json({ message: "url or urls is required" });
        return;
      }
      const form = await getFormById(id);
      if (!form) {
        res.status(404).json({ message: "Form not found" });
        return;
      }
      if (!form.ownerId.equals(new Types.ObjectId(req.user.id))) {
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      const existing = form.referenceMedia || [];
      form.referenceMedia = [...existing, ...targetUrls];
      await form.save();
      res.json(form);
    } catch (err) {
      next(err);
    }
  }
);

export const formRoutes = router;
