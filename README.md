# AI-Powered Dynamic Form Generator (Phase 3)

Generate, publish, and collect submissions from AI-built forms. Phase 3 adds context-aware memory with embeddings, top-K retrieval, and scalability notes while keeping prior APIs intact.

## Setup

Clone and install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

Environment variables:

- `MONGODB_URI` – MongoDB connection string (Atlas or local)
- `JWT_SECRET` – secret for signing JWTs
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` – Cloudinary upload credentials
- `LLM_API_KEY` – provider key (placeholder; hook up in `backend/src/services/aiService.ts`)
- `EMBEDDING_API_KEY`, `EMBEDDING_MODEL` – embedding provider creds/model (placeholder implementation by default)
- `USE_PINECONE_MEMORY` (true/false), `PINECONE_API_KEY`, `PINECONE_INDEX_NAME` – optional Pinecone vector store
- `MEMORY_TOP_K` (default 5), `MEMORY_MAX_FIELDS_PER_FORM` (default 20) – retrieval limits
- `FRONTEND_ORIGIN` – comma-separated origins allowed by backend CORS (e.g., `https://centr-align-code-marathon.vercel.app`)
- `PORT` (optional) – backend port (defaults to 4000)
- `NEXT_PUBLIC_API_BASE_URL` – frontend calls (e.g., `http://localhost:4000`)

Run locally:

```bash
cd backend
npm run dev
# in another shell
cd frontend
npm run dev
```

## Example Prompts

1. **Job application form** – "Create a job application form for a software engineer with name, email, years of experience, preferred tech stack, LinkedIn URL, and upload resume plus a headshot photo."
2. **Survey form** – "A short customer satisfaction survey with rating (1-5), would you recommend us yes/no, free-text feedback, and optional screenshot upload."
3. **Medical intake form** – "Patient intake with name, email, age, symptoms description, checkbox for pre-existing conditions, radio for insurance provider, and upload insurance card photo."

## Architecture Notes (Phase 3)

- **Form schema**: fields carry validation rules (required, min/max, patterns, type) and `fileConstraints` for uploads; forms also store `summary`, `tags`, `referenceMedia`, and `embedding`.
- **Validation**: Backend validates submissions against schema (required, email/number, length/range, file presence). Frontend mirrors validation and surfaces server errors inline.
- **Uploads**: Cloudinary-backed `/upload/image` with MIME/size checks. File fields in public forms use the upload endpoint; generator UI can attach reference images to forms.
- **Auth**: Email/password + JWT. Rate limiting on auth and AI generate endpoints.
- **Memory retrieval**: Each form stores an embedding (from prompt + schema summary). On generation, the prompt embedding retrieves top-K similar user forms (Mongo cosine or optional Pinecone). A trimmed history snippet (purpose/title/tags + field labels/types) is injected into the LLM prompt to steer the new schema. Smart memory can be toggled per request.
- **Context limits**: History is capped by `MEMORY_TOP_K` and per-form fields by `MEMORY_MAX_FIELDS_PER_FORM` to keep prompts small.

## How it works

- Describe a form → backend AI helper generates a `FormSchema` with validation and file constraints → saved to MongoDB with metadata.
- Public forms render from JSON at `/form/[id]`; submissions are persisted and validated server-side.
- Dashboard lists forms (with submission counts), shows details/summary/reference media, and supports filtering/searching through submissions.
- Memory-enhanced generation: prompt embedding → top-K similar forms → history snippet added to the LLM prompt → new schema generated and stored with its own embedding.

## Memory Retrieval & Scalability

- **Embedding storage**: Each form stores `embedding`, `summary`, `tags`. Combined text includes prompt/title/purpose/fields for better similarity.
- **Similarity search**: Default is Mongo-based cosine over user-owned forms. Optional Pinecone integration via `USE_PINECONE_MEMORY`; metadata filters on `userId`.
- **Why top-K**: Avoids token bloat and keeps latency predictable; most benefit comes from a handful of closest examples.
- **Scalability**: For thousands of forms, Mongo scan works; for 100k+ use Pinecone/Atlas Vector Search plus metadata filters. History snippets limit fields/forms to keep prompts small.
- **Latency controls**: Timings for embedding/retrieval/LLM are logged. Prompt includes only small instructions + trimmed history + user request.

## Backfill embeddings

If forms predate Phase 3, backfill embeddings:

```bash
cd backend
npm run backfill:embeddings
```

This computes missing embeddings and optionally upserts to Pinecone when enabled.

## Limitations & future improvements

- Embedding quality depends on chosen model/provider and incurs API cost.
- Pinecone integration is stubbed for now; swap in a real client.
- Could add better tagging/classification, caching of retrievals, and richer summarization.

## Deployment notes

Backend (e.g., Render):
- Root directory: `backend`
- Build: `npm install && npm run build`
- Start: `npm start` (Render provides `PORT`)
- Env vars required: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, plus optional `LLM_API_KEY`, `EMBEDDING_*`, `USE_PINECONE_MEMORY`, `FRONTEND_ORIGIN`
- Ensure Atlas IP access allows your host’s outbound IP or `0.0.0.0/0` (if acceptable).

Frontend (e.g., Vercel):
- Root directory: `frontend`
- Build: `npm run build`
- Output: `.next`
- Env: `NEXT_PUBLIC_API_BASE_URL` should point to your backend (e.g., `https://centralign-code-marathon.onrender.com`).

Common pitfalls:
- 404 on Vercel if root is not set to `frontend`.
- Mongo connection errors if Atlas IP whitelist doesn’t include your host.
- CORS: set `FRONTEND_ORIGIN` to your deployed frontend URL for the backend service.
