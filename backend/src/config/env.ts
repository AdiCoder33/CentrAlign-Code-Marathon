import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    // Warn but do not crash to keep dev experience smooth.
    console.warn(`[env] Missing environment variable ${key}`);
  }
});

const toBool = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

export interface AppConfig {
  port: string;
  mongoUri: string;
  jwtSecret: string;
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  llmApiKey: string;
  embedding: {
    apiKey: string;
    model: string;
  };
  memory: {
    usePinecone: boolean;
    topK: number;
    maxFieldsPerForm: number;
  };
  pinecone: {
    apiKey: string;
    indexName: string;
  };
}

export const config: AppConfig = {
  port: process.env.PORT || "4000",
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  llmApiKey: process.env.LLM_API_KEY || "",
  embedding: {
    apiKey: process.env.EMBEDDING_API_KEY || "",
    model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
  },
  memory: {
    usePinecone: toBool(process.env.USE_PINECONE_MEMORY, false),
    topK: Number(process.env.MEMORY_TOP_K || 5),
    maxFieldsPerForm: Number(process.env.MEMORY_MAX_FIELDS_PER_FORM || 20),
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || "",
    indexName: process.env.PINECONE_INDEX_NAME || "",
  },
};
