
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { pool } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import projectsRoutes from "./routes/projects.routes.js";
import taskRoutes from "./routes/tasks.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Validate required environment variables
if (!process.env.DATABASE_URL || !process.env.SESSION_SECRET) {
  throw new Error("DATABASE_URL and SESSION_SECRET must be configured.");
}

if (
  isProduction &&
  !process.env.CLIENT_URL?.startsWith("https://")
) {
  throw new Error("CLIENT_URL must use HTTPS in production.");
}

// Render runs behind a proxy
if (isProduction) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "10kb" }));

// PostgreSQL session store
const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: "taskflow.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Health checks
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "TaskFlow API is running.",
  });
});

app.get("/api/health/db", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      status: "ok",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);

    res.status(503).json({
      status: "error",
      message: "Database connection failed.",
    });
  }
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/projects/:projectId/tasks", taskRoutes);
app.use("/api/tasks", taskRoutes);

// Start server ONCE, after middleware and routes
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TaskFlow API running on port ${PORT}`);
});
