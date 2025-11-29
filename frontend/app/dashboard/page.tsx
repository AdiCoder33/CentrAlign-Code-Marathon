'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";
import { useAuthGuard } from "../../lib/useAuthGuard";

interface FormSummary {
  _id: string;
  title: string;
  purpose: string;
  createdAt: string;
  submissionCount?: number;
}

export default function DashboardPage() {
  const { loading } = useAuthGuard();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const fetchForms = async () => {
      setFetching(true);
      try {
        const data = await apiClient<FormSummary[]>("/forms");
        setForms(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load forms");
      } finally {
        setFetching(false);
      }
    };
    if (!loading) {
      void fetchForms();
    }
  }, [loading]);

  return (
    <div className="dashboard-hero">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Your Forms</h1>
          <p className="muted">
            Generate new forms with AI and keep an eye on submissions from one place.
          </p>
        </div>
        <Link href="/dashboard/forms/new" className="btn-primary">
          + Create new form
        </Link>
      </div>

      <div className="cards-grid">
        {fetching && <div className="glass-card">Loading your forms...</div>}
        {error && <div className="glass-card error-text">{error}</div>}
        {!fetching && forms.length === 0 && (
          <div className="glass-card">
            <h3>No forms yet</h3>
            <p className="muted">Describe your first form and start collecting responses.</p>
            <Link href="/dashboard/forms/new" className="nav-link">
              Create one now →
            </Link>
          </div>
        )}
        {forms.map((form) => (
          <div key={form._id} className="glass-card">
            <div className="card-top">
              <div>
                <h3 className="card-title">{form.title}</h3>
                <p className="muted">{form.purpose}</p>
              </div>
              <div className="pills">
                <span className="pill">
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
                <span className="pill">
                  {form.submissionCount ?? 0} submissions
                </span>
              </div>
            </div>
            <Link href={`/dashboard/forms/${form._id}`} className="nav-link">
              View details →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
