import express, { type ErrorRequestHandler } from 'express';
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

// Reject cross-origin browser mutations; CORS alone only restricts response reads.
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
    const origin = req.get('Origin');
    const allowed = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
    if ((origin && origin !== allowed) || req.get('Sec-Fetch-Site') === 'cross-site') {
      res.status(403).json({ error: 'Request origin is not allowed.' });
      return;
    }
  }
  next();
});

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
app.use('/api/sessions', rateLimit({
  windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please wait before trying again.' },
}), sessionsRouter);

// Unknown API routes never receive the SPA document.
app.use('/api', (_req, res) => { res.status(404).json({ error: 'API route not found.' }); });

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

// Safe JSON errors: never send stack traces, database errors, or request bodies.
const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  void _next; // Four arguments identify Express error middleware.
  const status = typeof error === 'object' && error !== null && 'status' in error
    ? error.status : undefined;
  if (status === 413) { res.status(413).json({ error: 'Request body is too large.' }); return; }
  if (status === 400) { res.status(400).json({ error: 'Invalid JSON request.' }); return; }
  res.status(500).json({ error: 'Request could not be completed. Please try again.' });
};
app.use(errorHandler);

export default app;
