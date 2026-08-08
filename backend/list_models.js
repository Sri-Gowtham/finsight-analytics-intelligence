import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function listModels() {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await client.models.list();
  for (const model of response) {
    if (model.name.includes("gemini")) console.log(model.name);
  }
}
listModels().catch(console.error);
