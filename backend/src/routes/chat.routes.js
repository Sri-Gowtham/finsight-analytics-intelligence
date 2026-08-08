import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { callGeminiWithRetry } from '../services/ai/gemini.service.js';

const router = Router();

const SYSTEM_PROMPT = `You are FinSight Assistant.

Your sole purpose is to help users navigate and understand the FinSight platform.

You can explain:
- Login
- Dashboard
- Analyst features
- CFO features
- Admin features
- Reports
- Insights
- Approvals
- Approval History
- What-if Analysis
- Historical Replay
- Peer Comparison
- Account Settings
- Platform workflows

Do not perform financial analysis.
Do not provide investment advice.
Do not predict financial performance.
Do not fabricate platform features.

If a user asks for financial analysis, explain that FinSight Assistant is only for platform navigation and direct them to the appropriate analysis feature.`;

// Simple in-memory rate limiter for public chatbot endpoint
const chatRateLimitMap = new Map();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute

const chatRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!chatRateLimitMap.has(ip)) {
    chatRateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_MS });
    return next();
  }
  
  const data = chatRateLimitMap.get(ip);
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + RATE_LIMIT_MS;
    return next();
  }
  
  if (data.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }
  
  data.count++;
  next();
};

// Removed requireAuth to allow public users (e.g. landing page) to ask for platform help
router.post('/', chatRateLimiter, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'message too long (max 500 chars)' });
    }

    // Build conversation — limit to last 6 messages to keep tokens low
    const recentHistory = history.slice(-6);
    const messages = [
      ...recentHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    const reply = await callGeminiWithRetry(messages, SYSTEM_PROMPT, {
      model: 'gemini-flash-latest',
      temperature: 0.3,
    });

    return res.json({ 
      success: true, 
      reply 
    });
  } catch (err) {
    next(err);
  }
});

export default router;
