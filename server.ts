import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please add it to secrets in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Initial Prompt Generation
app.post("/api/generate-initial", async (req, res) => {
  try {
    const { prompt, tone, audience, goal, attachments } = req.body;
    const ai = getGeminiClient();

    const textPrompt = `You are a world-class creative writing partner, editor, and thought companion.
Translate the user's prompt into a polished, engaging piece of writing.
Ensure the writing strictly aligns with the following guidelines:
- Tone: ${tone || "Creative"}
- Target Audience: ${audience || "General Readers"}
- Writing Goal: ${goal || "Educate and Entertain"}

User's Writing Prompt:
"${prompt}"

Divide the output into logistically complete, cohesive sections or paragraphs. Return them as a JSON array of strings, where each element is a highly polished paragraph/chunk. Ensure there are no markdown lists inside the JSON array element, and paragraphs are naturally formatted.
`;

    const contents: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data) {
          contents.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data, // base64 string
            },
          });
        }
      }
    }
    contents.push({ text: textPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A logically separate paragraph of the document",
          },
        },
      },
    });

    const parsedArray = JSON.parse(response.text || "[]");
    return res.json({ paragraphs: parsedArray });
  } catch (error: any) {
    console.error("Error at /api/generate-initial:", error);
    return res.status(500).json({ error: error.message || "An error occurred during generation." });
  }
});

// 2. Iterate block-by-block with contextual inline feedback
app.post("/api/iterate-block", async (req, res) => {
  try {
    const { blockText, userFeedback, beforeContext, afterContext, tone, audience, goal } = req.body;
    const ai = getGeminiClient();

    const textPrompt = `You are a precise editorial companion. Your task is to rewrite the target paragraph based on the user's revision feedback while seamlessly integrating it back into the flow of the document.

Target Paragraph to Rewrite:
"${blockText}"

User's Revision Feedback / Instruction:
"${userFeedback}"

To ensure an exceptionally cohesive verbal transition and avoid duplication, here is the immediate surrounding context:
${beforeContext ? `[Previous Paragraph Context]: "${beforeContext}"` : "[No preceding paragraph]"}
${afterContext ? `[Succeeding Paragraph Context]: "${afterContext}"` : "[No succeeding paragraph]"}

Ensure the rewrite reflects:
- Tone: ${tone || "Creative"}
- Target Audience: ${audience || "General Readers"}
- Document Goal: ${goal || "Support overall flow"}

Provide the rewritten text and a very brief editorial explanation (1-2 sentences) of how you integrated the feedback. Return strictly in JSON format.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The rewritten, beautiful, and flow-safe paragraph content.",
            },
            explanation: {
              type: Type.STRING,
              description: "Brief editorial note explanation of how you wove in the changes.",
            },
          },
          required: ["text", "explanation"],
        },
      },
    });

    return res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error at /api/iterate-block:", error);
    return res.status(500).json({ error: error.message || "An error occurred during block iteration." });
  }
});

// 3. Proactive Self-Invoking Coaching & Critique
app.post("/api/suggest-improvements", async (req, res) => {
  try {
    const { blocks, tone, audience, goal } = req.body;
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return res.json({ suggestions: [] });
    }

    const ai = getGeminiClient();

    // Map blocks with indices
    const blocksTextWithId = blocks
      .map((b: any) => `[Block ID: ${b.id}]\n"${b.text}"`)
      .join("\n\n");

    const textPrompt = `You are a proactive, supportive writing coach. Analyze the user's active document draft blocks below. Identifying opportunities for stylistic polish, structural improvements, emotional hooks, grammatical issues, clarity enhances, or vocabulary variety.

Document Style Settings:
- Tone: ${tone || "Creative"}
- Target Audience: ${audience || "General Readers"}
- Document Goal: ${goal || "Overall excellence"}

Active Document Draft Blocks:
${blocksTextWithId}

Generate 2 to 4 proactive, constructive inline suggestions.
For each suggestion, specify the EXACT Block ID it belongs to, state a clear title/critique, explanation, reference the snippet that is problematic, and propose the exact modified replacement block.
Make the suggested replacements flow naturally with the adjacent text. Return strictly as JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: textPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "Critique suggestions mapped to blocks",
          items: {
            type: Type.OBJECT,
            properties: {
              blockId: {
                type: Type.STRING,
                description: "The ID of the block that this suggestion is critiqueing.",
              },
              type: {
                type: Type.STRING,
                description: "Must be exactly one of: 'style', 'grammar', 'structure', 'engagement', 'clarity'.",
              },
              title: {
                type: Type.STRING,
                description: "Short, punchy editorial title of the critique.",
              },
              description: {
                type: Type.STRING,
                description: "Constructive advice on why this change is suggested.",
              },
              originalTextSnippet: {
                type: Type.STRING,
                description: "The snippet or complete text being corrected.",
              },
              suggestedText: {
                type: Type.STRING,
                description: "The complete proposed replacement text for the entire block, fully polishing the snippet.",
              },
            },
            required: ["blockId", "type", "title", "description", "originalTextSnippet", "suggestedText"],
          },
        },
      },
    });

    const suggestions = JSON.parse(response.text || "[]");
    return res.json({ suggestions });
  } catch (error: any) {
    console.error("Error at /api/suggest-improvements:", error);
    return res.status(500).json({ error: error.message || "An error occurred during coaching generation." });
  }
});

// 4. Writing Mentor Interactive Context Chat
app.post("/api/chat-mentor", async (req, res) => {
  try {
    const { message, chatHistory, blocks, tone, audience, goal } = req.body;
    const ai = getGeminiClient();

    // Contextual summary of active document blocks
    const documentBrief = (blocks || [])
      .map((b: any, i: number) => `Paragraph ${i + 1}:\n"${b.text}"`)
      .join("\n\n");

    const systemInstruction = `You are a supportive, warm, and highly capable Writing Mentor, creative partner, and brainstorming companion.
The user is working on a document in their online draft editor with the style:
- Tone: ${tone || "Creative"}
- Target Audience: ${audience || "General Readers"}
- Document Goal: ${goal || "Support overall flow"}

Here is their entire current draft's content:
${documentBrief || "[The document is currently empty]"}

Analyze their request in direct connection with the current text blocks. If they ask for alternatives, help brainstorm them. If they ask about transitions, suggest a smooth bridge.
Keep your response warm, concise, and professional. Speak like an expert editor.
`;

    // Format chat history for Gemini chat or simple system contents call
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error at /api/chat-mentor:", error);
    return res.status(500).json({ error: error.message || "An error occurred in mentor chat." });
  }
});

// Serve Vite dev server or static distribution files
async function startServer() {
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
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
