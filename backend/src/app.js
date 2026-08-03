import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import companiesRouter from './routes/companies.routes.js';
import clientsRouter from './routes/clients.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

// ── Global middleware ───────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());

// ── Routes ──────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/clients',   clientsRouter);

// ── Error handling (must be registered last) ────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
