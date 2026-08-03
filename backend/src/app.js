import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import healthRouter from './routes/health.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

// ── Global middleware ───────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());

// ── Routes ──────────────────────────────────────────
app.use('/api/health', healthRouter);

// ── Error handling (must be registered last) ────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
