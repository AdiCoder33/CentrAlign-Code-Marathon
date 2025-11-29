import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMedia extends Document {
  url: string;
  uploadedBy: Types.ObjectId | null;
  context?: string;
  createdAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    context: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const MediaModel =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
