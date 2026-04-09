import express from 'express';
import cors from 'cors';
import watchlistRouter from './routes/watchlist.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/watchlist', watchlistRouter);
app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
