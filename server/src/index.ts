import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { analyzeRouter } from './routes/analyze.js';

const app = express();

// ── Security headers (Helmet defaults) ───────────────────────────────────────
app.use(helmet());

// ── CORS — restricted to configured client origin ────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
  })
);

// ── Body parsing — limit to 16 kb to prevent large payload attacks ────────────
app.use(express.json({ limit: '16kb' }));

// ── Rate limiting on AI route (10 req / 15 min per IP) ───────────────────────
const analyzeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before trying again.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/analyze', analyzeLimiter, analyzeRouter);

export default app;
