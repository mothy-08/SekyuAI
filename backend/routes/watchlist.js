import { Router } from 'express';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST_PATH = resolve(__dirname, '../watchlist.json');

const router = Router();

async function readWatchlist() {
  const data = await readFile(WATCHLIST_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeWatchlist(list) {
  await writeFile(WATCHLIST_PATH, JSON.stringify(list, null, 2));
}

// GET /api/watchlist
router.get('/', async (req, res) => {
  try {
    const list = await readWatchlist();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/watchlist
router.post('/', async (req, res) => {
  try {
    const { repo } = req.body;
    if (!repo || typeof repo !== 'string') {
      return res.status(400).json({ error: 'repo (string) is required in request body' });
    }

    const list = await readWatchlist();
    if (list.includes(repo)) {
      return res.status(409).json({ error: 'Repo is already in the watchlist' });
    }

    list.push(repo);
    await writeWatchlist(list);
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/watchlist/:repo
router.delete('/:repo', async (req, res) => {
  try {
    const repo = decodeURIComponent(req.params.repo);
    const list = await readWatchlist();
    const updated = list.filter((r) => r !== repo);

    if (updated.length === list.length) {
      return res.status(404).json({ error: 'Repo not found in watchlist' });
    }

    await writeWatchlist(updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
