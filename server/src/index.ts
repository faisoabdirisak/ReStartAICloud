import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type'],
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
