import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page-shell">
      <div className="card">
        <h1>AI-Powered Dynamic Form Generator</h1>
        <p>
          Describe the form you need and instantly publish it. Collect responses
          and manage submissions from a single dashboard.
        </p>
        <Link href="/auth/signup" className="btn-primary">
          Get started
        </Link>
      </div>
    </div>
  );
}
