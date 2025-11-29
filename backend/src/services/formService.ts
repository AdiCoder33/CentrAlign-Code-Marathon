import { Types } from "mongoose";
import { FormModel, FormDocument } from "../models/Form";
import { generateFormSchemaFromPrompt } from "./aiService";
import { FormField, FormSchema } from "../types";
import { generateEmbedding } from "./embeddingService";
import { config } from "../config/env";
import { upsertFormEmbedding, querySimilarForms } from "./pineconeService";

const derivePurpose = (prompt: string, schema: FormSchema): string => {
  if (schema.description) return schema.description.slice(0, 120);
  return prompt.slice(0, 120) || "Generated form";
};

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0 || b.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const buildCombinedText = (
  prompt: string,
  schema: FormSchema,
  summary?: string,
  tags?: string[]
): string => {
  const fieldText = (schema.fields || [])
    .map((f) => `${f.label} (${f.type}) ${f.validation ? "v" : ""}`)
    .join(", ");
  return [
    prompt,
    schema.title,
    schema.description,
    summary,
    tags?.join(" "),
    fieldText,
  ]
    .filter(Boolean)
    .join("\n");
};

export const findSimilarFormsForUser = async (
  ownerId: Types.ObjectId,
  queryEmbedding: number[],
  topK: number
): Promise<FormDocument[]> => {
  const forms = await FormModel.find({
    ownerId,
    embedding: { $exists: true, $ne: [] },
  }).exec();
  const ranked = forms
    .map((f) => ({
      form: f,
      score: cosineSimilarity(queryEmbedding, f.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((r) => r.form);
  return ranked;
};

const buildFormHistorySnippet = (
  forms: FormDocument[],
  maxFields: number
): Array<{
  id: string;
  purpose: string;
  title: string;
  tags: string[];
  fields: Array<{
    name: string;
    label: string;
    type: string;
    hasValidation: boolean;
    hasFileConstraints: boolean;
  }>;
}> =>
  forms.map((f) => ({
    id: f._id.toString(),
    purpose: f.purpose || f.summary || "",
    title: f.title,
    tags: f.tags || [],
    fields: ((f as any).formSchema?.fields || [])
      .slice(0, maxFields)
      .map((field: FormField) => ({
        name: field.name,
        label: field.label,
        type: field.type,
        hasValidation: !!field.validation,
        hasFileConstraints: !!field.fileConstraints,
      })),
  }));

const buildPromptWithHistory = (
  prompt: string,
  historySnippet: unknown[]
): string => {
  if (!historySnippet.length) return prompt;
  return `You are an intelligent form schema generator.\nHere is relevant user form history for reference:\n${JSON.stringify(
    historySnippet
  )}\n\nNow generate a new form schema for this request:\n${prompt}`;
};

export const createForm = async (
  ownerId: Types.ObjectId,
  prompt: string,
  options?: { useMemory?: boolean }
): Promise<{ form: FormDocument; source: "llm" | "fallback" }> => {
  const useMemory = options?.useMemory ?? true;
  const timings: Record<string, number> = {};

  let historyForms: FormDocument[] = [];
  let promptEmbedding: number[] | null = null;

  if (useMemory) {
    const embedStart = Date.now();
    try {
      promptEmbedding = await generateEmbedding({ text: prompt });
    } catch (err) {
      console.warn("[memory] prompt embedding failed", err);
    }
    timings.embeddingMs = Date.now() - embedStart;

    if (promptEmbedding && promptEmbedding.length > 0) {
      const retrieveStart = Date.now();
      if (config.memory.usePinecone) {
        const matches = await querySimilarForms(
          ownerId.toString(),
          promptEmbedding,
          config.memory.topK
        );
        const ids = matches.map((m) => m.formId);
        historyForms = await FormModel.find({
          _id: { $in: ids },
          ownerId,
        }).exec();
      } else {
        historyForms = await findSimilarFormsForUser(
          ownerId,
          promptEmbedding,
          config.memory.topK
        );
      }
      timings.retrievalMs = Date.now() - retrieveStart;
    }
  }

  const historySnippet = useMemory
    ? buildFormHistorySnippet(historyForms, config.memory.maxFieldsPerForm)
    : [];
  const promptWithHistory = buildPromptWithHistory(prompt, historySnippet);

  const llmStart = Date.now();
  const { schema, summary, tags, source } =
    await generateFormSchemaFromPrompt(promptWithHistory);
  timings.llmMs = Date.now() - llmStart;

  const purpose = derivePurpose(prompt, schema);
  const combinedText = buildCombinedText(prompt, schema, summary, tags);

  let formEmbedding: number[] | undefined;
  try {
    formEmbedding = await generateEmbedding({ text: combinedText });
  } catch (err) {
    console.warn("[memory] form embedding failed", err);
  }

  const formPayload: Record<string, unknown> = {
    ownerId,
    title: schema.title,
    purpose,
    summary,
    tags: tags ?? [],
    formSchema: schema,
    referenceMedia: [],
  };
  formPayload.embedding = formEmbedding ?? [];

  const form = await FormModel.create(formPayload);

  if (config.memory.usePinecone && formEmbedding && formEmbedding.length > 0) {
    await upsertFormEmbedding(form._id.toString(), ownerId.toString(), formEmbedding, {
      userId: ownerId.toString(),
      title: form.title,
      purpose: form.purpose,
      tags: form.tags || [],
    });
  }

  console.log(
    `[forms] Created form ${form._id} for owner ${ownerId.toString()} source=${source} (embedding ${
      formEmbedding?.length || 0
    }) timings=${JSON.stringify(timings)}`
  );
  return { form, source };
};

export const getUserForms = async (
  ownerId: Types.ObjectId
): Promise<FormDocument[]> =>
  FormModel.find({ ownerId }).sort({ createdAt: -1 }).exec();

export const getFormById = async (id: string): Promise<FormDocument | null> =>
  FormModel.findById(id).exec();
