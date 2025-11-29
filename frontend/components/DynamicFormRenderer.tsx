'use client';

import { FormEvent, useMemo, useState } from "react";
import { FormSchema, FormField } from "../lib/types";
import { ImageUpload } from "./ImageUpload";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Props {
  formId: string;
  schema: FormSchema;
}

export const DynamicFormRenderer = ({ formId, schema }: Props) => {
  const initialResponses = useMemo(() => {
    const base: Record<string, unknown> = {};
    schema.fields.forEach((field) => {
      base[field.name] = field.type === "checkbox" ? false : "";
    });
    return base;
  }, [schema.fields]);

  const [responses, setResponses] = useState<Record<string, unknown>>(
    initialResponses
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (name: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const validateClient = (): Record<string, string> => {
    const nextErrors: Record<string, string> = {};
    schema.fields.forEach((field) => {
      const value = responses[field.name];
      const v = field.validation || {};
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");

      if (v.required && isEmpty) {
        nextErrors[field.name] = "Required";
        return;
      }
      if (isEmpty) return;

      if (field.type === "email" || v.type === "email") {
        const ok = typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!ok) nextErrors[field.name] = "Invalid email";
      }

      if (field.type === "number" || v.type === "number") {
        const num = typeof value === "number" ? value : Number(value);
        if (Number.isNaN(num)) {
          nextErrors[field.name] = "Must be a number";
          return;
        }
        if (typeof v.min === "number" && num < v.min) {
          nextErrors[field.name] = `Min ${v.min}`;
        }
        if (typeof v.max === "number" && num > v.max) {
          nextErrors[field.name] = `Max ${v.max}`;
        }
      }

      if (typeof v.minLength === "number" || typeof v.maxLength === "number") {
        const text = String(value);
        if (typeof v.minLength === "number" && text.length < v.minLength) {
          nextErrors[field.name] = `Min length ${v.minLength}`;
        }
        if (typeof v.maxLength === "number" && text.length > v.maxLength) {
          nextErrors[field.name] = `Max length ${v.maxLength}`;
        }
      }
    });
    return nextErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/forms/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.errors) {
          setErrors(data.errors as Record<string, string>);
          setSubmitting(false);
          return;
        }
        throw new Error(data?.message || (await res.text()));
      }
      setSubmitted(true);
      setResponses(initialResponses);
      setErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card">
        <h3>Thank you! 🎉</h3>
        <button className="btn-secondary" onClick={() => setSubmitted(false)}>
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h1>{schema.title}</h1>
      {schema.description && <p>{schema.description}</p>}
      {schema.fields.map((field) => {
        const fieldId = `field-${field.name}`;
        const fieldError = errors[field.name];
        switch (field.type) {
          case "textarea":
            return (
              <div key={field.name}>
                <label className="label" htmlFor={fieldId}>
                  {field.label}
                </label>
                <textarea
                  id={fieldId}
                  className="textarea"
                  placeholder={field.placeholder}
                  required={field.validation?.required}
                  value={(responses[field.name] as string) || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
          case "select":
            return (
              <div key={field.name}>
                <label className="label" htmlFor={fieldId}>
                  {field.label}
                </label>
                <select
                  id={fieldId}
                  className="select"
                  required={field.validation?.required}
                  value={(responses[field.name] as string) || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                >
                  <option value="">Select...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
          case "checkbox":
            return (
              <div key={field.name}>
                <label className="label">
                  <input
                    type="checkbox"
                    checked={Boolean(responses[field.name])}
                    onChange={(e) =>
                      handleChange(field.name, e.target.checked)
                    }
                  />{" "}
                  {field.label}
                </label>
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
          case "radio":
            return (
              <div key={field.name}>
                <div className="label">{field.label}</div>
                {(field.options || []).map((opt) => (
                  <label key={opt} style={{ marginRight: 12 }}>
                    <input
                      type="radio"
                      name={field.name}
                      value={opt}
                      checked={responses[field.name] === opt}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.validation?.required}
                    />{" "}
                    {opt}
                  </label>
                ))}
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
          case "file":
            return (
              <div key={field.name}>
                <div className="label">{field.label}</div>
                <ImageUpload
                  onUploadComplete={(url) => handleChange(field.name, url)}
                  constraints={field.fileConstraints}
                />
                {(() => {
                  const value = responses[field.name];
                  if (typeof value === "string" && value) {
                    return (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={value}
                          alt="upload preview"
                          style={{ maxWidth: 180, borderRadius: 8 }}
                        />
                      </div>
                    );
                  }
                  return null;
                })()}
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
          default:
            return (
              <div key={field.name}>
                <label className="label" htmlFor={fieldId}>
                  {field.label}
                </label>
                <input
                  id={fieldId}
                  className="input"
                  type={field.type}
                  placeholder={field.placeholder}
                  required={field.validation?.required}
                  value={(responses[field.name] as string) || ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
                {fieldError && <p style={{ color: "red" }}>{fieldError}</p>}
              </div>
            );
        }
      })}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};
