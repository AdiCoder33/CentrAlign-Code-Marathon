import { Types } from "mongoose";
import { SubmissionModel, ISubmission } from "../models/Submission";
import { FormModel } from "../models/Form";
import { FormSchema, FormField } from "../types";

export const createSubmission = async (
  formId: Types.ObjectId,
  ownerId: Types.ObjectId,
  responses: Record<string, unknown>
): Promise<ISubmission> => {
  const submission = await SubmissionModel.create({
    formId,
    userId: ownerId,
    responses,
  });
  console.log(
    `[submissions] Created submission ${submission._id} for form ${formId.toString()}`
  );
  return submission;
};

export const getSubmissionsByForm = async (
  formId: string,
  ownerId: Types.ObjectId
): Promise<ISubmission[]> => {
  const form = await FormModel.findById(formId);
  if (!form) {
    throw new Error("Form not found");
  }
  if (!form.ownerId.equals(ownerId)) {
    throw new Error("Unauthorized");
  }

  return SubmissionModel.find({ formId: form._id })
    .sort({ createdAt: -1 })
    .exec();
};

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateResponses = (
  schema: FormSchema,
  responses: Record<string, unknown>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  const fields = schema.fields || [];

  fields.forEach((field: FormField) => {
    const value = responses[field.name];
    const validation = field.validation || {};

    if (validation.required && isEmpty(value)) {
      errors[field.name] = "This field is required";
      return;
    }

    if (isEmpty(value)) return;

    if (field.type === "email" || validation.type === "email") {
      if (typeof value !== "string" || !isEmail(value)) {
        errors[field.name] = "Invalid email format";
        return;
      }
    }

    if (field.type === "number" || validation.type === "number") {
      const num = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(num)) {
        errors[field.name] = "Must be a number";
        return;
      }
      if (typeof validation.min === "number" && num < validation.min) {
        errors[field.name] = `Must be at least ${validation.min}`;
      }
      if (typeof validation.max === "number" && num > validation.max) {
        errors[field.name] = `Must be at most ${validation.max}`;
      }
    }

    if (
      (field.type === "text" ||
        field.type === "textarea" ||
        typeof value === "string") &&
      (typeof validation.minLength === "number" ||
        typeof validation.maxLength === "number")
    ) {
      const str = String(value);
      if (
        typeof validation.minLength === "number" &&
        str.length < validation.minLength
      ) {
        errors[field.name] = `Minimum length is ${validation.minLength}`;
      }
      if (
        typeof validation.maxLength === "number" &&
        str.length > validation.maxLength
      ) {
        errors[field.name] = `Maximum length is ${validation.maxLength}`;
      }
    }

    if (validation.pattern) {
      try {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(String(value))) {
          errors[field.name] = "Invalid format";
        }
      } catch {
        // ignore bad patterns
      }
    }

    if (field.type === "file") {
      if (typeof value !== "string" || value.trim() === "") {
        errors[field.name] = "File URL is required";
        return;
      }
      if (
        field.fileConstraints?.allowedMimeTypes &&
        field.fileConstraints.allowedMimeTypes.length > 0
      ) {
        const mimeFromUrl = value.split("?")[0] || "";
        const lower = mimeFromUrl.toLowerCase();
        const ok = field.fileConstraints.allowedMimeTypes.some((m) =>
          lower.includes(m.split("/")[1]?.toLowerCase() || m.toLowerCase())
        );
        if (!ok) {
          errors[field.name] = "File type not allowed";
        }
      }
    }
  });

  return errors;
};
