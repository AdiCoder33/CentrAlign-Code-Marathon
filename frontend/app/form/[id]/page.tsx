'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FormSchema } from "../../../lib/types";
import { DynamicFormRenderer } from "../../../components/DynamicFormRenderer";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface FormResponse {
  _id: string;
  schema: FormSchema;
  title: string;
  description?: string;
}

export default function PublicFormPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE}/forms/${id}`);
        if (!res.ok) throw new Error("Form not found");
        const data = (await res.json()) as FormResponse;
        setForm(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    void fetchForm();
  }, [id]);

  if (loading) return <div className="page-shell">Loading...</div>;
  if (error || !form)
    return <div className="page-shell">{error || "Form not found"}</div>;

  return (
    <div className="page-shell">
      <DynamicFormRenderer formId={form._id} schema={form.schema} />
    </div>
  );
}
