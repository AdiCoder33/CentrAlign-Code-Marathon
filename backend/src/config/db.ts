import mongoose from "mongoose";
import { config } from "./env";

export const connectDB = async (): Promise<void> => {
  if (!config.mongoUri) {
    throw new Error("MONGODB_URI is not set");
  }

  await mongoose.connect(config.mongoUri);
  console.log("[db] Connected to MongoDB");
};
