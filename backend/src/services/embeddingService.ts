import { config } from "../config/env";

export interface EmbeddingOptions {
  text: string;
}

// Placeholder embedding generator. Swap with a real provider (e.g., OpenAI) using config.embedding.apiKey/model.
export async function generateEmbedding({
  text,
}: EmbeddingOptions): Promise<number[]> {
  if (!text.trim()) return [];
  if (!config.embedding.apiKey) {
    // Deterministic pseudo-embedding for offline/dev use.
    const vector = new Array(64).fill(0).map((_, idx) => {
      const char = text.charCodeAt(idx % text.length) || 0;
      return (Math.sin(char + idx) + 1) * 0.5;
    });
    return vector;
  }
  // TODO: integrate real embedding provider here; respect config.embedding.model.
  const fallback = new Array(64).fill(0).map((_, idx) => Math.random() * 0.01 + idx * 0.0001);
  return fallback;
}
