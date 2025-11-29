import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { formRoutes } from "./routes/formRoutes";
import { submissionRoutes } from "./routes/submissionRoutes";
import { uploadRoutes } from "./routes/uploadRoutes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use(submissionRoutes); // includes /forms/:id/submit + submissions
app.use("/upload", uploadRoutes);

app.use(errorHandler);

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}`);
  });
};

void start();
