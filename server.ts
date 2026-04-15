import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  // API Route for Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      
      if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({ error: "GROQ_API_KEY is not configured." });
      }

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful customer support assistant for Astrateq Gadgets. You help users with questions about their premium dash cams and family safety bundles. Keep responses concise and professional. Mention that Phase 1 is local-only and no subscription is required.",
          },
          ...messages,
        ],
        model: "llama-3.3-70b-versatile",
      });

      res.json({ message: completion.choices[0]?.message?.content || "No response from AI." });
    } catch (error) {
      console.error("Groq API Error:", error);
      res.status(500).json({ error: "Failed to communicate with Groq." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
