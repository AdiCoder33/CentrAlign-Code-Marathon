import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISubmission extends Document {
  formId: Types.ObjectId;
  userId: Types.ObjectId;
  responses: Record<string, unknown>;
  createdAt: Date;
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    formId: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    responses: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SubmissionModel =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>("Submission", SubmissionSchema);
