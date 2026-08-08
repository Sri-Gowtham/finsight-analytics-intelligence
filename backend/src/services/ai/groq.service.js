import Groq from 'groq-sdk';
import { logger } from '../../data_collector/logger/index.js';

let groqClientInstance = null;

/**
 * Initializes and returns the Groq client instance.
 * @returns {Groq}
 */
export function getGroqClient() {
  if (!groqClientInstance) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error('GROQ_API_KEY environment variable is not defined.');
      throw new Error('GROQ_API_KEY environment variable is not defined.');
    }
    groqClientInstance = new Groq({ apiKey });
  }
  return groqClientInstance;
}

/**
 * Calls the Groq Chat Completions API with built-in retries, exponential backoff, and timeout handling.
 * @param {Array<Object>} messages - The array of message objects for the chat model.
 * @param {Object} options - Configuration options for the API call.
 * @param {string} [options.model='llama-3.3-70b-versatile'] - The Groq model to use.
 * @param {Object} [options.responseFormat={ type: 'json_object' }] - The response format configuration.
 * @param {number} [options.temperature=0] - The temperature setting.
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts.
 * @param {number} [options.initialDelayMs=1000] - Initial delay before retry.
 * @param {number} [options.backoffFactor=2] - Multiplier for backoff delay.
 * @param {number} [options.timeoutMs=15000] - Request timeout in milliseconds.
 * @returns {Promise<Object>} The chat completion response data.
 */
export async function callGroqWithRetry(messages, options = {}) {
  const {
    model = 'llama-3.3-70b-versatile',
    responseFormat = { type: 'json_object' },
    temperature = 0,
    maxRetries = 3,
    initialDelayMs = 1000,
    backoffFactor = 2,
    timeoutMs = 15000,
  } = options;

  let delay = initialDelayMs;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Sending request to Groq API (Attempt ${attempt}/${maxRetries})`, { model });
      const client = getGroqClient();

      // Setup timeout using Promise.race
      const apiCallPromise = client.chat.completions.create({
        messages,
        model,
        response_format: responseFormat,
        temperature,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Groq API request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([apiCallPromise, timeoutPromise]);
      logger.info(`Successfully received response from Groq API (Attempt ${attempt})`);
      return response;
    } catch (error) {
      lastError = error;
      logger.warn(`Groq API call failed on attempt ${attempt}: ${error.message}`, {
        attempt,
        error: error.message,
      });

      if (attempt === maxRetries) {
        break;
      }

      logger.info(`Waiting ${delay}ms before retrying Groq API call...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  logger.error(`All ${maxRetries} attempts to call Groq API failed.`, lastError);
  throw new Error(`Failed to contact Groq API: ${lastError.message}`);
}
