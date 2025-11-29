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
    origin: true, // reflect request origin (allows deployed frontend)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

// primary routes
app.use("/auth", authRoutes);
app.use("/forms", formRoutes);
app.use(submissionRoutes); // includes /forms/:id/submit + submissions
app.use("/upload", uploadRoutes);

// API aliases (for deployments using /api/* paths)
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api", submissionRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port}`);
  });
};

void start();
