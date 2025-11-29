import mongoose from "mongoose";
import { connectDB } from "../src/config/db";
import { FormModel } from "../src/models/Form";
import { generateEmbedding } from "../src/services/embeddingService";
import { upsertFormEmbedding } from "../src/services/pineconeService";
import { config } from "../src/config/env";
import { FormSchema } from "../src/types";

const buildCombinedText = (schema: FormSchema, prompt: string, summary?: string, tags?: string[]) => {
  const fieldText = schema.fields
    .map((f) => `${f.label} (${f.type}) ${f.validation ? "v" : ""}`)
    .join(", ");
  return [prompt, schema.title, schema.description, summary, tags?.join(" "), fieldText]
    .filter(Boolean)
    .join("\n");
};

const run = async () => {
  await connectDB();
  const cursor = FormModel.find({}).cursor();
  let updated = 0;
  for await (const form of cursor) {
    if (form.embedding && form.embedding.length) continue;
    const combinedText = buildCombinedText(
      form.schema as FormSchema,
      form.purpose,
      form.summary,
      form.tags
    );
    const embedding = await generateEmbedding({ text: combinedText });
    form.embedding = embedding;
    await form.save();
    if (config.memory.usePinecone && embedding.length > 0) {
      await upsertFormEmbedding(form._id.toString(), form.ownerId.toString(), embedding, {
        userId: form.ownerId.toString(),
        title: form.title,
        purpose: form.purpose,
        tags: form.tags,
      });
    }
    updated += 1;
    console.log(`[backfill] updated form ${form._id}`);
  }
  console.log(`[backfill] completed. Updated ${updated} forms.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("[backfill] failed", err);
  process.exit(1);
});
