// SERVICE: one shared wrapper around the Gemini API.
// Every AI feature (cost predictor, eligibility, RAG advisor...) uses this
// instead of talking to the SDK directly — if Google changes something,
// we fix it in exactly one file.
import { GoogleGenAI } from "@google/genai";

// Free-tier friendly default; override with GEMINI_MODEL in .env if needed.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let client = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(
      "GEMINI_API_KEY is missing in server/.env — get a free key at https://aistudio.google.com/apikey"
    );
    err.statusCode = 503;
    throw err;
  }
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

// Ask Gemini a question, get plain text back.
export async function generateText(prompt) {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  return response.text;
}

// Ask Gemini for STRUCTURED data: returns parsed JSON matching your schema.
// JSON mode means no "Sure! Here's your JSON:" chatter to clean up.
export async function generateJSON(prompt, schema) {
  const response = await getClient().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      ...(schema ? { responseSchema: schema } : {}),
    },
  });
  return JSON.parse(response.text);
}
