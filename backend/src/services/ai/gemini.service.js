import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI = null;

function getGeminiClient() {
  if (!_genAI) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. The chatbot will fail.");
    }
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }
  return _genAI;
}

export async function callGeminiWithRetry(messages, systemInstruction, options = {}) {
  const {
    model = 'gemini-3.5-flash',
    temperature = 0.3,
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
    timeoutMs = 15000,
  } = options;

  // Validate empty messages
  if (!messages || messages.length === 0) {
    throw new Error("Message history cannot be empty");
  }

  // Convert to Gemini format (roles: "user" or "model")
  // System instructions are passed in getGenerativeModel
  const contents = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'ai' || msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

  let delay = initialDelayMs;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const genAI = getGeminiClient();
      
      const generativeModel = genAI.getGenerativeModel({
        model: model,
        systemInstruction: systemInstruction,
      });

      const apiCallPromise = generativeModel.generateContent({
        contents: contents,
        generationConfig: {
          temperature: temperature,
        }
      });
      
      // Prevent unhandled rejection crash if apiCallPromise fails after timeout
      apiCallPromise.catch(() => {});

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      return response.response.text();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw new Error(`Failed to contact Gemini API: ${lastError?.message}`);
}
