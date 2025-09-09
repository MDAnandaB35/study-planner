import express from "express";
import axios from "axios";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /ai/complete
// Body: { prompt: string }
router.post("/complete", requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Field 'prompt' is required and must be a string",
        success: false
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
        success: false
      });
    }

    const systemPrefix = "You are a concise assistant. Keep answers brief and helpful.";
    const userPrompt = `User: ${prompt}`;

    // Call OpenAI Chat Completions API (compatible with latest v1 endpoints)
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrefix },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 400
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const choice = response.data?.choices?.[0];
    const text = choice?.message?.content || "";

    return res.json({
      success: true,
      result: text,
      model: response.data?.model,
      usage: response.data?.usage
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message || "OpenAI request failed";
    return res.status(status).json({ success: false, error: message });
  }
});

export default router;


