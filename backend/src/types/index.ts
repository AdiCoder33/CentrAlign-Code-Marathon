export type FormFieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "file";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  type?: "email" | "number" | "url";
}

export interface FileConstraints {
  maxSizeMB?: number;
  allowedMimeTypes?: string[];
}

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  options?: string[];
  validation?: ValidationRule;
  fileConstraints?: FileConstraints;
}

export interface FormSchema {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface SubmissionPayload {
  responses: Record<string, unknown>;
}

export interface JwtUser {
  id: string;
  email: string;
}
