import express from 'express';
import cors from 'cors';
import watchlistRouter from './routes/watchlist.js';
import webhookRouter from './routes/webhook.js';

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({
  extended: true,
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use('/api/watchlist', watchlistRouter);
app.use('/webhook', webhookRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
