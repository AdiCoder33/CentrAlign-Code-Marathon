'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "../../../../lib/apiClient";
import { useAuthGuard } from "../../../../lib/useAuthGuard";
import { FormSchema } from "../../../../lib/types";
import Link from "next/link";

interface FormDetail {
  _id: string;
  title: string;
  purpose: string;
  createdAt: string;
  schema: FormSchema;
  summary?: string;
  referenceMedia?: string[];
}

interface Submission {
  _id: string;
  createdAt: string;
  responses: Record<string, unknown>;
}

export default function FormDetailPage() {
  useAuthGuard();
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [form, setForm] = useState<FormDetail | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [formData, submissionsData] = await Promise.all([
          apiClient<FormDetail>(`/forms/${id}`),
          apiClient<{ submissions: Submission[] }>(`/forms/${id}/submissions`),
        ]);
        setForm(formData);
        setSubmissions(submissionsData.submissions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id]);

  const filtered = submissions.filter((s) => {
    const ts = new Date(s.createdAt).getTime();
    if (fromDate && ts < new Date(fromDate).getTime()) return false;
    if (toDate && ts > new Date(toDate).getTime()) return false;
    if (search) {
      const hay = JSON.stringify(s.responses).toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  if (loading) return <div className="page-shell">Loading...</div>;
  if (error) return <div className="page-shell">{error}</div>;
  if (!form) return <div className="page-shell">Form not found</div>;

  return (
    <div className="page-shell">
      <div className="card">
        <h2>{form.title}</h2>
        <p>{form.purpose}</p>
        {form.schema.description && <p>{form.schema.description}</p>}
        <p className="pill">
          Created {new Date(form.createdAt).toLocaleString()}
        </p>
        {form.summary && <p><strong>Summary:</strong> {form.summary}</p>}
        {form.referenceMedia && form.referenceMedia.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {form.referenceMedia.map((url) => (
              <img
                key={url}
                src={url}
                alt="reference"
                style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
              />
            ))}
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <Link href={`/form/${id}`} className="btn-secondary">
            Open public form
          </Link>
        </div>
      </div>

      <div className="card">
        <h3>Submissions</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <label className="label">From</label>
            <input
              className="input"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              className="input"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Search</label>
            <input
              className="input"
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <p>No submissions yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((submission, idx) => (
                <tr key={submission._id}>
                  <td>{idx + 1}</td>
                  <td>
                    {new Date(submission.createdAt).toLocaleDateString()}{" "}
                    {new Date(submission.createdAt).toLocaleTimeString()}
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => setSelected(submission)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {selected && (
          <div className="card" style={{ marginTop: 12 }}>
            <h4>Submission Details</h4>
            <button
              className="btn-secondary"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
            <ul>
              {Object.entries(selected.responses).map(([key, value]) => {
                const asString = String(value);
                const looksLikeImage = /\.(png|jpg|jpeg|gif)$/i.test(asString);
                const looksLikeUrl = asString.startsWith("http");
                return (
                  <li key={key} style={{ marginBottom: 8 }}>
                    <strong>{key}:</strong>{" "}
                    {looksLikeImage ? (
                      <img
                        src={asString}
                        alt={key}
                        style={{ maxWidth: 200, display: "block", marginTop: 6 }}
                      />
                    ) : looksLikeUrl ? (
                      <a href={asString} target="_blank" rel="noreferrer">
                        {asString}
                      </a>
                    ) : (
                      asString
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
