import { config } from "../config/env";

interface UpsertMetadata {
  userId: string;
  title?: string;
  purpose?: string;
  tags?: string[];
}

export const upsertFormEmbedding = async (
  formId: string,
  userId: string,
  embedding: number[],
  metadata: UpsertMetadata
): Promise<void> => {
  if (!config.memory.usePinecone || !config.pinecone.apiKey) {
    return;
  }
  // TODO: implement real Pinecone upsert. Stub keeps API surface ready.
  console.log(`[pinecone] upsert form ${formId} for user ${userId} (vector length ${embedding.length})`);
};

export const querySimilarForms = async (
  userId: string,
  queryEmbedding: number[],
  topK: number
): Promise<Array<{ formId: string; score: number }>> => {
  if (!config.memory.usePinecone || !config.pinecone.apiKey) {
    return [];
  }
  // TODO: implement real Pinecone query. Stub returns empty to fall back to Mongo/local similarity.
  console.log(`[pinecone] query for user ${userId} (vector length ${queryEmbedding.length})`);
  return [];
};
