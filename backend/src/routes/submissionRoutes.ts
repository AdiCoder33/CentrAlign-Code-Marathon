import { Router, Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { FormModel } from "../models/Form";
import {
  createSubmission,
  getSubmissionsByForm,
  validateResponses,
} from "../services/submissionService";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post(
  "/forms/:id/submit",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "Form id is required" });
        return;
      }
      const { responses } = req.body;
      const form = await FormModel.findById(id);
      if (!form) {
        res.status(404).json({ message: "Form not found" });
        return;
      }
      const schema = (form as any).formSchema || (form as any).schema;
      const errors = validateResponses(schema, responses || {});
      if (Object.keys(errors).length > 0) {
        res.status(400).json({ errors });
        return;
      }
      const submission = await createSubmission(
        form._id,
        form.ownerId,
        responses || {}
      );
      res.json({ submission });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/forms/:id/submissions",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "Form id is required" });
        return;
      }
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const submissions = await getSubmissionsByForm(
        id,
        new Types.ObjectId(req.user.id)
      );
      res.json({ submissions });
    } catch (err) {
      next(err);
    }
  }
);

export const submissionRoutes = router;
