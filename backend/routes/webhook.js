import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { patchFile } from '../services/gemini.js';
import {
  getFileContent,
  getLatestSHA,
  createBlob,
  createTree,
  createCommit,
  createBranch,
  createPR,
} from '../services/github.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WATCHLIST_PATH = resolve(__dirname, '../watchlist.json');

const router = Router();

function verifySignature(rawBody, signature) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('WEBHOOK_SECRET environment variable is not set');
  }
  if (!signature) return false;

  const digest = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const sigBuffer = Buffer.from(signature);
  const digestBuffer = Buffer.from(digest);

  if (sigBuffer.length !== digestBuffer.length) return false;
  return timingSafeEqual(sigBuffer, digestBuffer);
}

async function getWatchlist() {
  const data = await readFile(WATCHLIST_PATH, 'utf-8');
  return JSON.parse(data);
}

// POST /webhook
router.post('/', async (req, res) => {
  // 1. Validate HMAC SHA-256 signature
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = req.rawBody;

  if (!rawBody) {
    return res.status(400).json({ error: 'Missing raw body for signature verification' });
  }

  let signatureValid;
  try {
    signatureValid = verifySignature(rawBody, signature);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  if (!signatureValid) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // 2. Only handle push events
  const event = req.headers['x-github-event'];
  if (event !== 'push') {
    return res.status(200).json({ message: `Event "${event}" ignored` });
  }

  // GitHub may send either application/json or application/x-www-form-urlencoded.
  // In the urlencoded case the JSON payload is nested under req.body.payload.
  let payload = req.body;
  if (typeof payload?.payload === 'string') {
    try {
      payload = JSON.parse(payload.payload);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON in urlencoded payload' });
    }
  }
  const repoFullName = payload?.repository?.full_name;
  const ref = payload?.ref; // e.g. "refs/heads/main"
  const commits = payload?.commits ?? [];

  if (!repoFullName || !ref) {
    return res.status(400).json({ error: 'Invalid push payload' });
  }

  const baseBranch = ref.replace('refs/heads/', '');

  // 3. Check if repo is in the watchlist
  let watchlist;
  try {
    watchlist = await getWatchlist();
  } catch (err) {
    return res.status(500).json({ error: `Failed to read watchlist: ${err.message}` });
  }

  if (!watchlist.includes(repoFullName)) {
    return res.status(200).json({ message: 'Repository not in watchlist, skipping' });
  }

  // 4. Collect unique changed files across all commits.
  // Sanitize paths: reject traversal sequences and absolute paths.
  const changedFiles = [
    ...new Set(
      commits.flatMap((c) => [...(c.added ?? []), ...(c.modified ?? [])]),
    ),
  ].filter((p) => typeof p === 'string' && !p.includes('..') && !p.startsWith('/'));

  if (changedFiles.length === 0) {
    return res.status(200).json({ message: 'No added or modified files in push' });
  }

  // 5. Process files sequentially to avoid overwhelming the Gemini API
  const results = [];
  for (const filePath of changedFiles) {
    let fileContent;
    try {
      const { content } = await getFileContent(repoFullName, filePath, baseBranch);
      fileContent = content;
    } catch (err) {
      results.push({ file: filePath, status: 'error', message: `Could not fetch file: ${err.message}` });
      continue;
    }

    let analysis;
    try {
      analysis = await patchFile(filePath, fileContent);
    } catch (err) {
      results.push({ file: filePath, status: 'error', message: `Gemini analysis failed: ${err.message}` });
      continue;
    }

    if (!analysis.isVulnerable) {
      results.push({ file: filePath, status: 'clean' });
      continue;
    }

    // 6. Create patch branch and PR
    try {
      // Append a sanitized file slug to prevent branch name collisions
      const fileSlug = filePath.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 60);
      const branchName = `sekyuai-patch-${Date.now()}-${fileSlug}`;

      const parentSha = await getLatestSHA(repoFullName, baseBranch);
      const blobSha = await createBlob(repoFullName, analysis.patchedCode);
      const treeSha = await createTree(repoFullName, parentSha, filePath, blobSha);
      const commitSha = await createCommit(
        repoFullName,
        `[SekyuAI] Fix security vulnerability in ${filePath}`,
        treeSha,
        parentSha,
      );
      await createBranch(repoFullName, branchName, commitSha);

      const prTitle = `[SekyuAI] Security Vulnerability Patch - ${filePath}`;
      const prBody = `## Security Vulnerability Patch\n\n**File:** \`${filePath}\`\n\n**Analysis:**\n${analysis.explanation}`;

      const pr = await createPR(repoFullName, baseBranch, branchName, prTitle, prBody);
      results.push({ file: filePath, status: 'patched', pr: pr.html_url });
    } catch (err) {
      results.push({ file: filePath, status: 'error', message: `Failed to create patch PR: ${err.message}` });
    }
  }

  return res.status(200).json({ processed: results });
});

export default router;
