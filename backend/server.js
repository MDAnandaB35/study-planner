import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

// CORS with whitelist for local and production frontend domains
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://quickmap-learn.netlify.app"
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Make Supabase available to routes via app locals
app.set("supabase", supabase);

// Routes
import authRoutes from "./routes/auth.js";
import aiRoutes from "./routes/ai.js";
import { requireAuth } from "./middleware/authMiddleware.js";

app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);

// Public route
app.get("/", (req, res) => {
  res.json({ 
    message: "Express + Supabase Auth backend running",
    endpoints: {
      auth: {
        signup: "POST /auth/signup",
        login: "POST /auth/login", 
        logout: "POST /auth/logout"
      },
      protected: {
        profile: "GET /profile"
      }
    }
  });
});

// Protected route example for testing
app.get("/profile", requireAuth, (req, res) => {
  res.json({
    message: "Protected route accessed successfully!",
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at
    }
  });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on http://localhost:${process.env.PORT}`)
);
