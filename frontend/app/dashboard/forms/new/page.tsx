'use client';

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "../../../../lib/apiClient";
import { useAuthGuard } from "../../../../lib/useAuthGuard";
import { FormSchema } from "../../../../lib/types";
import { FormBuilderPreview } from "../../../../components/FormBuilderPreview";
import { ImageUpload } from "../../../../components/ImageUpload";

interface FormResponse {
  _id: string;
  title: string;
  purpose: string;
  schema: FormSchema;
}

export default function NewFormPage() {
  useAuthGuard();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [form, setForm] = useState<FormResponse | null>(null);
  const [referenceMedia, setReferenceMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachMessage, setAttachMessage] = useState<string | null>(null);
  const [useMemory, setUseMemory] = useState(true);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient<FormResponse>("/forms/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, useMemory }),
      });
      setForm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate form");
    } finally {
      setLoading(false);
    }
  };

  const handleAttachReference = async (url: string) => {
    if (!form?._id) return;
    setAttachMessage(null);
    try {
      await apiClient(`/forms/${form._id}/reference-media`, {
        method: "POST",
        body: JSON.stringify({ url }),
      });
      setReferenceMedia((prev) => [...prev, url]);
      setAttachMessage("Reference image attached.");
    } catch (err) {
      setAttachMessage(
        err instanceof Error ? err.message : "Could not attach image"
      );
    }
  };

  return (
    <div className="page-shell">
      <div className="card">
        <h2>Generate a form with AI</h2>
        <form onSubmit={handleGenerate}>
          <label className="label">Describe your form</label>
          <textarea
            className="textarea"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g. Collect feedback for our new product launch"
            required
          />
          <label className="label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={useMemory}
              onChange={(e) => setUseMemory(e.target.checked)}
            />
            Use smart memory (reuse your past forms)
          </label>
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate & Save"}
          </button>
        </form>
      </div>
      {form && (
        <div className="card">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3>Preview</h3>
            <button
              className="btn-secondary"
              onClick={() => router.push(`/dashboard/forms/${form._id}`)}
            >
              Open form details
            </button>
          </div>
          <FormBuilderPreview schema={form.schema} />
          <div style={{ marginTop: 16 }}>
            <h4>Attach reference images (optional)</h4>
            <ImageUpload onUploadComplete={handleAttachReference} />
            {attachMessage && <p>{attachMessage}</p>}
            {referenceMedia.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {referenceMedia.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt="reference"
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
