import mongoose, { Schema, Types, HydratedDocument, Model } from "mongoose";
import { FormSchema as FormSchemaType } from "../types";

export interface IForm {
  ownerId: Types.ObjectId;
  title: string;
  purpose: string;
  formSchema: FormSchemaType;
  schema?: FormSchemaType; // virtual for compatibility
  summary?: string;
  tags?: string[];
  referenceMedia?: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export type FormDocument = HydratedDocument<IForm>;

const FormSchema = new Schema<IForm>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    purpose: { type: String, required: true },
    formSchema: { type: Schema.Types.Mixed, required: true },
    summary: { type: String },
    tags: { type: [String], default: () => [] },
    referenceMedia: { type: [String], default: () => [] },
    embedding: { type: [Number], default: () => [] },
  },
  { timestamps: true }
);

FormSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.schema = ret.formSchema;
    delete (ret as any).formSchema;
    return ret;
  },
});

FormSchema.set("toObject", {
  transform: (_doc, ret) => {
    ret.schema = ret.formSchema;
    delete (ret as any).formSchema;
    return ret;
  },
});

export const FormModel: Model<IForm> =
  mongoose.models.Form || mongoose.model<IForm>("Form", FormSchema);
