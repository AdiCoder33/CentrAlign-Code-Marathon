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

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://centr-align-code-marathon.vercel.app/",
  "https://centralign-code-marathon.vercel.app",
];

const allowedOrigins = (config.frontendOrigin || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const list = allowedOrigins.length ? allowedOrigins : defaultOrigins;
      if (list.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
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
