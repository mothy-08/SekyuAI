import { GoogleGenAI } from "@google/genai";

export async function patchFile(filePath, rawCode) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are a security code auditor. Analyze the following code for security vulnerabilities.

Respond ONLY with a single raw JSON object — no markdown, no code fences, no explanation outside the JSON.
The JSON must exactly match this schema:
{ "isVulnerable": boolean, "patchedCode": "string", "explanation": "string" }

- "isVulnerable": true if any security vulnerability is found, false otherwise.
- "patchedCode": the full fixed source code (same as input if no vulnerability found).
- "explanation": a concise description of what was found and what was changed.

File: ${filePath}
Code:
${rawCode}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const text = response.text;

  // Safely extract the first JSON object from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Gemini returned an unparsable response for ${filePath}: ${text}`,
    );
  }

  const result = JSON.parse(jsonMatch[0]);

  if (
    typeof result.isVulnerable !== "boolean" ||
    typeof result.patchedCode !== "string" ||
    typeof result.explanation !== "string"
  ) {
    throw new Error(`Gemini response schema mismatch for ${filePath}`);
  }

  return result;
}
