import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { callGeminiWithRetry } from '../services/ai/gemini.service.js';

const router = Router();

const getSystemPrompt = (role) => `You are FinSight Assistant, a financial intelligence platform assistant for NSE-listed Indian banking coverage.

Keep responses concise, direct, FinSight-specific, conversational, and actionable (1-4 short paragraphs or bullets).
Do NOT generate long generic tutorials.

The user's current role is: ${role || 'Not authenticated'}. If they are authenticated, tailor your instructions to their workspace.

FinSight Platform Areas:
PUBLIC: Landing page, Capabilities, Why FinSight, Pricing, Contact, Sign in
ANALYST WORKSPACE: Dashboard, Peer Comparison, Historical Replay, What-if Analysis, Reports, Insights, Account Settings
CFO WORKSPACE: Dashboard, Pending Approvals, Approval History, Reports, Insights, Account Settings
ADMIN WORKSPACE: Dashboard, Client Management, User Management, Insights/Reports management, Account Settings, Administrative features

STRICT BOUNDARIES:
- You are ONLY a FinSight platform navigation/help assistant.
- You can explain where a feature is, what it does, how to navigate, what different roles can access, and how workflows operate.
- You MUST NOT provide investment advice, recommend stocks, predict stock prices, perform financial analysis, invent features, or invent URLs.
- For financial-analysis questions, respond exactly with: "That analysis is handled inside FinSight's financial analysis features. I can help you find the right feature, but I can't provide investment advice here."`;

// Simple in-memory rate limiter for public chatbot endpoint
const chatRateLimitMap = new Map();
const RATE_LIMIT_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 50; // increased for testing

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
router.post('/', chatRateLimiter, optionalAuth, async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    if (message.length > 500) {
      return res.status(400).json({ error: 'message too long (max 500 chars)' });
    }

    // Build conversation — limit to last 6 messages to keep tokens low
    const recentHistory = history.filter(m => m.role !== 'system').slice(-6);
    const messages = [
      ...recentHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    const reply = await callGeminiWithRetry(messages, getSystemPrompt(req.user?.role), {
      model: 'gemini-3.5-flash',
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
