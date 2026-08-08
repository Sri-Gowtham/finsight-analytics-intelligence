import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { corsOptions } from './config/cors.js';
import { configurePassport } from './config/passport.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import companiesRouter from './routes/companies.routes.js';
import clientsRouter from './routes/clients.routes.js';
import whatifRouter from './routes/whatif.routes.js';
import insightsRouter from './routes/insights.routes.js';
import rawFinancialsRouter from './routes/raw-financials.routes.js';
import marketIntelligenceRoutes from './routes/market-intelligence.routes.js';
import analysisRouter from './routes/analysis.routes.js';
import reportsRouter from './routes/reports.routes.js';
import chatRouter from './routes/chat.routes.js';
import portfoliosRouter from './routes/portfolios.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';

const app = express();

// ── Global middleware ───────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'finsight-oauth-secret-key',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
configurePassport();

// ── Routes ──────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/clients',   clientsRouter);
app.use('/api/whatif',    whatifRouter);
app.use('/api/insights',  insightsRouter);
app.use('/api/raw-financials', rawFinancialsRouter);
app.use('/api/market-intelligence', marketIntelligenceRoutes);
app.use('/api/analysis',  analysisRouter);
app.use('/api/reports',   reportsRouter);
app.use('/api/chat',      chatRouter);
app.use('/api/portfolios', portfoliosRouter);

// ── Error handling (must be registered last) ────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
