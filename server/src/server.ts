import app from './index.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
