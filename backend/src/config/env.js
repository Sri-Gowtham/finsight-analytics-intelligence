/**
 * Centralised environment variable access.
 * Import this module whenever you need config values so that
 * missing-variable errors surface early and in one place.
 */

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port:        process.env.PORT || 3001,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret:   required('JWT_SECRET'),
  openaiKey:   process.env.OPENAI_API_KEY || '',   // optional at boot
  agentWebhookUrl:  process.env.AGENT_WEBHOOK_URL || '',          // optional at boot
  agentTimeoutMs:   Number(process.env.AGENT_TIMEOUT_MS) || 60000,
  agentMaxRetries:  Number(process.env.AGENT_MAX_RETRIES) || 2,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv:     process.env.NODE_ENV || 'development',
};
