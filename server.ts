import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up generous file transfer limits for studying workbooks
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazily get Google GenAI Client and safely enforce api key configuration
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not defined. Please verify your Secrets in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// REST route to parse exam/exercise notes PDFs
app.post("/api/parse-pdf", async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: "Missing paper PDF content binary data." });
    }

    const ai = getGenAIClient();

    // Clean base64 header if present
    let rawBase64 = pdfBase64;
    if (rawBase64.includes(";base64,")) {
      rawBase64 = rawBase64.split(";base64,").pop();
    }

    const pdfPart = {
      inlineData: {
        data: rawBase64,
        mimeType: "application/pdf",
      },
    };

    const promptText = `
You are a highly skilled scholarly assistant specialized in parsing academic worksheets, mock tests, and exercises.
Your goal is to extract questions from the uploaded PDF document, along with their solutions or explanations.

Please strictly follow this protocol:
1. Scan the whole document page-by-page. Find all multiple choice questions.
2. For each question, extract:
   - Question number (1, 2, 3...)
   - Subject category (e.g., 'Physics', 'Chemistry', 'Botany', 'Zoology', or general academic area)
   - Detailed question body. Re-format math, chemical formulas, and equations in readable unicode text or simple clean LaTeX (e.g. vectors, powers, fractions clearly printed).
   - An array containing exactly 4 multiple choice options. Strip away any leading markers like '(1)', '(2)', '(3)', '(4)', '(a)', '(b)', '(c)', '(d)'. Only include the actual text.
3. Locate the list of answers or answers keys (which is usually a page titled 'Answers' or a table at the end). Match the question number to its correct answer key and compute/retrieve its 0-indexed correct option (e.g. key '(1)' translates to correctOptionIndex 0, '(2)' is 1, '(3)' is 2, '(4)' is 3).
4. Parse the corresponding explanation in the 'Hints and Solutions' section. Capture the full detailed analytical steps, integration formulas, or concepts, and write it elegantly in the 'solution' field. Keep solutions extensive and helpful to high-school/NEET students!
5. Invent an accurate, descriptive title for the test (such as 'Aakash Fast Track PST-02F' or the names of topics identified in instructions).
6. Return a structurally clean JSON matching the requested responseSchema.

Extract up to 35-50 questions in sequence starting from the first page. Keep extraction complete and accurate.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [pdfPart, promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            testTitle: {
              type: Type.STRING,
              description: "The name of the test or chapter",
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  number: { type: Type.INTEGER },
                  subject: {
                    type: Type.STRING,
                    description: "Course subject, e.g. Physics, Chemistry, Botany, Zoology, Calculus...",
                  },
                  questionText: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 options in order",
                  },
                  correctOptionIndex: {
                    type: Type.INTEGER,
                    description: "0-indexed correct answer (0 = Option 1, 1 = Option 2, 2 = Option 3, 3 = Option 4)",
                  },
                  solution: {
                    type: Type.STRING,
                    description: "Explanation steps, formulas or descriptions of the solution",
                  },
                },
                required: [
                  "number",
                  "subject",
                  "questionText",
                  "options",
                  "correctOptionIndex",
                  "solution",
                ],
              },
            },
          },
          required: ["testTitle", "questions"],
        },
      },
    });

    const outputText = response.text || "{}";
    const dataResponse = JSON.parse(outputText);

    return res.json({ success: true, data: dataResponse });
  } catch (err: any) {
    console.error("Critical exam parser error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to process the PDF worksheet.",
    });
  }
});

// REST route to dynamically generate real-time scientific/mathematical mnemonics
app.post("/api/generate-mnemonic", async (req, res) => {
  try {
    const { subject, topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Missing topic name or scientific terms to construct mnemonic." });
    }

    const ai = getGenAIClient();
    const promptText = `
You are an expert high-yield NEET educational memory coach and study tutor. Your primary command is to generate a highly detailed and concepts-first mnemonic package. The user needs to learn and recall the ACTUAL sequence, chronological order, or physical concept, not just memorize random letters.

Subject: ${subject || "General Science / NEET Preparation"}
Topic to remember: "${topic}"

State clearly:
1. "topicTitle": A clean, descriptive title for this topic.
2. "mnemonic": The literal list of items/symbols/letters to remember in order.
3. "phrase": A catchy, memorable phrase (an acronym or phrase mnemonic, e.g., "Keep Ponds Clean Or Frogs Get Sick").
4. "mapping": An array of objects showing how each letter/word of the mnemonic phrase maps to the target science concept element.
   CRITICAL REQUIREMENT: The "standsFor" value MUST include both (a) the correct name of the scientific term/concept, AND (b) a concise explanation or description of what that term/concept is, its function, or how it acts in the sequence (e.g., "Prophase - chromatin condenses and chromosomes become visible", or "Lithium (Li) - Group 1 alkali metal, stores charge dynamically"). Do NOT just return single words.
5. "explanation": A comprehensive, step-by-step educational breakdown of the chemical/biological process, mathematical formula, physical law, or sequence. Explain the real concept in full detail, highlighting the physical mechanisms, the exact chronological order, and why this is highly tested in competitive exams. Provide a paragraph of clear, rigorous scientific context.

Return a structurally clean JSON matching the requested responseSchema. Avoid any extra markdown code formatting wrappers outside the raw JSON.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [promptText],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicTitle: { type: Type.STRING },
            mnemonic: { type: Type.STRING },
            phrase: { type: Type.STRING },
            mapping: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  standsFor: { type: Type.STRING },
                },
                required: ["key", "standsFor"],
              }
            },
            explanation: { type: Type.STRING }
          },
          required: ["topicTitle", "mnemonic", "phrase", "mapping", "explanation"]
        }
      }
    });

    const outputText = response.text || "{}";
    const dataResponse = JSON.parse(outputText);
    return res.json({ success: true, data: dataResponse });
  } catch (err: any) {
    console.error("Critical mnemonic generation error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to generate mnemonic from Gemini.",
    });
  }
});

// Start routing and compile setup
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
    console.log(`Server started running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
