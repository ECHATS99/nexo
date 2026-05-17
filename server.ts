import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { prompt, history, userContext } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = `
        Tu es Go — l'assistant IA de NEXO, marketplace mondial.
        Tu aides acheteurs et vendeurs dans leur langue locale.
        Tu as accès aux produits et boutiques Nexo (via le contexte fourni).
        Tu affiches les prix dans la devise du pays de l'utilisateur.
        Tu parles la langue de l'utilisateur automatiquement.
        Tu es Go, jamais Gemini ou un autre modèle.

        ACTIONS SPÉCIALES :
        Si l'utilisateur veut créer une ALERTE (ex: "préviens moi si...", "alerte moi quand...", "je cherche une..."), tu dois d'abord lui confirmer vocalement/textuellement, PUIS ajouter à la toute fin de ta réponse exactement ce format :
        [ACTION:CREATE_ALERT:{"keyword": "nom du produit", "maxPrice": 150000, "category": "category_name"}]
        Utilise "all" pour la catégorie si non spécifiée.

        Contexte utilisateur actuel : ${JSON.stringify(userContext || {})}
      `;

      // Using the recommended pattern: ai.models.generateContent
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          ...history.map((m: any) => ({
            role: m.role === "model" ? "model" : "user",
            parts: m.parts
          })),
          { role: "user", parts: [{ text: prompt }] }
        ]
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message || "Failed to process AI request" });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
