import { FormField, FormSchema } from "../types";
import { config } from "../config/env";

const SYSTEM_PROMPT = `
You are an intelligent form schema generator. Output ONLY JSON matching this TypeScript type:
{
  "title": string;
  "description"?: string;
  "fields": Array<{
    "name": string;
    "label": string;
    "type": "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio" | "file";
    "placeholder"?: string;
    "options"?: string[];
    "validation"?: {
      "required"?: boolean;
      "minLength"?: number;
      "maxLength"?: number;
      "min"?: number;
      "max"?: number;
      "pattern"?: string;
      "type"?: "email" | "number" | "url";
    };
    "fileConstraints"?: {
      "maxSizeMB"?: number;
      "allowedMimeTypes"?: string[];
    };
  }>;
}
Supported field types: text, email, number, textarea, select, checkbox, radio, file.
If the user mentions images/photos/documents, use type: "file" and set fileConstraints.
Mark obvious email fields with validation.type="email" and required=true when appropriate.
`.trim();

const slugify = (label: string): string =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 50) || "field";

const applyDefaults = (fields: FormField[], prompt: string): FormField[] => {
  const seen = new Set<string>();
  return fields.map((field, idx) => {
    const base: FormField = { ...field };
    const cleanName = slugify(base.name || base.label || `field-${idx}`);
    let uniqueName = cleanName;
    let counter = 1;
    while (seen.has(uniqueName)) {
      uniqueName = `${cleanName}-${counter++}`;
    }
    seen.add(uniqueName);
    base.name = uniqueName;

    if (base.type === "email") {
      base.validation = {
        ...(base.validation || {}),
        type: base.validation?.type || "email",
        required: base.validation?.required ?? true,
      };
    }

    const labelLower = (base.label || "").toLowerCase();
    if (
      base.type === "number" ||
      labelLower.includes("age") ||
      labelLower.includes("years")
    ) {
      base.type = "number";
      base.validation = {
        min: base.validation?.min ?? 0,
        ...(base.validation || {}),
      };
    }

    if (base.type === "file" && !base.fileConstraints) {
      base.fileConstraints = {
        maxSizeMB: 5,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      };
    }

    return base;
  });
};

const deriveSummary = (prompt: string, schema: FormSchema): string =>
  schema.description?.slice(0, 180) ||
  prompt.slice(0, 180) ||
  `Form about ${schema.title}`;

const deriveTags = (prompt: string, fields: FormField[]): string[] => {
  const keywords = new Set<string>();
  prompt
    .toLowerCase()
    .split(/\W+/)
    .filter((p) => p.length > 3)
    .forEach((k) => keywords.add(k));
  fields.forEach((f) => {
    (f.label || "")
      .toLowerCase()
      .split(/\W+/)
      .filter((p) => p.length > 3)
      .forEach((k) => keywords.add(k));
  });
  return Array.from(keywords).slice(0, 10);
};

const parseJsonSafe = (text: string): FormSchema | null => {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as FormSchema;
  } catch {
    return null;
  }
};

// Placeholder LLM call. Swap this implementation with a real provider using config.llmApiKey.
const callLLM = async (userPrompt: string): Promise<FormSchema | null> => {
  if (!config.llmApiKey) return null;
  const model =
    process.env.LLM_MODEL || "google/gemma-3n-e4b-it:free";
  const combinedPrompt = `${SYSTEM_PROMPT}\n\nUser prompt:\n${userPrompt}`;
  const body = {
    model,
    messages: [
      // Some models (e.g., gemma free) don't support system messages; combine into user content.
      { role: "user", content: combinedPrompt },
    ],
    temperature: 0.2,
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llmApiKey}`,
        // OpenRouter recommends these headers for allow-listing.
        "HTTP-Referer":
          process.env.SITE_URL ||
          process.env.FRONTEND_ORIGIN ||
          "http://localhost:3000",
        "X-Title": process.env.SITE_TITLE || "AI Form Generator",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn("[ai] LLM request failed", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as any;
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      "";
    if (!content) return null;
    const parsed = parseJsonSafe(content.trim());
    return parsed;
  } catch (err) {
    console.warn("[ai] LLM call error", err);
    return null;
  }
};

const fallbackSchema = (prompt: string): FormSchema => ({
  title: "Custom Form",
  description: `Auto-generated form for: ${prompt.slice(0, 80)}`,
  fields: [
    { name: "full-name", label: "Full Name", type: "text", validation: { required: true, minLength: 2 } },
    { name: "email", label: "Email", type: "email", validation: { required: true, type: "email" } },
    {
      name: "details",
      label: "Details",
      type: "textarea",
      placeholder: "Add any notes",
      validation: { minLength: 10, maxLength: 500 },
    },
    {
      name: "attachment",
      label: "Attachment",
      type: "file",
      fileConstraints: { maxSizeMB: 5, allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"] },
    },
  ],
});

export interface GeneratedMeta {
  schema: FormSchema;
  summary: string;
  tags: string[];
  source: "llm" | "fallback";
}

export const generateFormSchemaFromPrompt = async (
  prompt: string
): Promise<GeneratedMeta> => {
  if (!prompt.trim()) {
    throw new Error("Prompt is required");
  }

  console.log(`[ai] Generating form for prompt: ${prompt.slice(0, 120)}`);
  const llmResponse = await callLLM(prompt);
  const baseSchema = llmResponse || fallbackSchema(prompt);
  const schema: FormSchema = {
    ...baseSchema,
    fields: applyDefaults(baseSchema.fields || [], prompt),
  };

  const summary = deriveSummary(prompt, schema);
  const tags = deriveTags(prompt, schema.fields);

  const source: "llm" | "fallback" = llmResponse ? "llm" : "fallback";

  if (source === "fallback") {
    console.warn("[ai] Falling back to deterministic schema");
  }

  return { schema, summary, tags, source };
};
