import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeRouter } from './routes/analyze.js';
import { sessionsRouter } from './routes/sessions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Security headers (Helmet defaults) ───────────────────────────────────────
app.use(helmet());

// ── CORS — restricted to configured client origin, allow credentials ─────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true, // required for HttpOnly cookie exchange
  })
);

// ── Body parsing — limit to 16 kb to prevent large payload attacks ────────────
app.use(express.json({ limit: '16kb' }));

// ── Cookie parsing ────────────────────────────────────────────────────────────
app.use(cookieParser());

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
app.use('/api/sessions', sessionsRouter);

// ── Static file serving (production) ─────────────────────────────────────────
// In production, Express serves the pre-built client SPA.
// The dev proxy in vite.config.ts handles this in development.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  // SPA fallback — any non-API route returns index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

export default app;
