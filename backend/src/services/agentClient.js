import { env } from '../config/env.js';

/**
 * Calls the Workbench agent webhook with a JSON payload and returns the
 * parsed JSON response. Retries on timeouts and 5xx; never on 4xx.
 *
 * The workflow must return its output in the response body (e.g. via a
 * "respond to webhook" step). A response with `result: null` means the
 * workflow ran but returned nothing, which is treated as an error.
 */
export async function runAgent(payload) {
  if (!env.agentWebhookUrl) throw new Error('AGENT_WEBHOOK_URL is not configured');

  let lastErr;
  for (let attempt = 0; attempt <= env.agentMaxRetries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), env.agentTimeoutMs);
    try {
      const res = await fetch(env.agentWebhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (res.status >= 400 && res.status < 500) {
        throw Object.assign(new Error(`Agent rejected request: ${res.status}`), { noRetry: true });
      }
      if (!res.ok) throw new Error(`Agent error: ${res.status}`);
      const body = await res.json();
      if (body.result === null || body.result === undefined) {
        throw Object.assign(new Error('Agent workflow returned no result'), { noRetry: true });
      }
      return body.result;
    } catch (err) {
      lastErr = err;
      if (err.noRetry) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
