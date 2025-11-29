'use client';

import { useState, ChangeEvent } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

interface Props {
  onUploadComplete: (url: string) => void;
  constraints?: { maxSizeMB?: number; allowedMimeTypes?: string[] };
}

export const ImageUpload = ({ onUploadComplete, constraints }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (constraints?.maxSizeMB && file.size / (1024 * 1024) > constraints.maxSizeMB) {
      setError(`File exceeds ${constraints.maxSizeMB}MB limit`);
      return;
    }
    if (
      constraints?.allowedMimeTypes &&
      constraints.allowedMimeTypes.length > 0 &&
      !constraints.allowedMimeTypes.includes(file.type)
    ) {
      setError("File type not allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { url: string };
      onUploadComplete(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && <span className="pill">Uploading...</span>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};
