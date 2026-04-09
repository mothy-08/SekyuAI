#!/usr/bin/env node
// scripts/test-webhook.js
// Sends a mock GitHub push payload signed with HMAC SHA-256 to the local webhook endpoint.
// Usage: WEBHOOK_SECRET=<secret> node scripts/test-webhook.js

import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load WEBHOOK_SECRET from backend/.env if not already in environment
let secret = process.env.WEBHOOK_SECRET;
if (!secret) {
  try {
    const envPath = resolve(__dirname, '../backend/.env');
    const envContents = readFileSync(envPath, 'utf8');
    const match = envContents.match(/^WEBHOOK_SECRET=(.+)$/m);
    if (match) secret = match[1].trim();
  } catch {
    // file not found – fall through to error below
  }
}

if (!secret) {
  console.error(
    'Error: WEBHOOK_SECRET is not set.\n' +
    'Either set it as an environment variable or add it to backend/.env'
  );
  process.exit(1);
}

const PORT = process.env.PORT ?? 3000;
const TARGET_URL = `http://localhost:${PORT}/webhook`;

const payload = {
  ref: 'refs/heads/main',
  repository: {
    full_name: 'test-owner/test-repo',
    name: 'test-repo',
    owner: { login: 'test-owner' },
  },
  commits: [
    {
      id: 'abc1234',
      message: 'test: mock push event from test-webhook.js',
      added: [],
      modified: ['src/index.js'],
      removed: [],
    },
  ],
  pusher: { name: 'test-owner', email: 'test@example.com' },
};

const body = JSON.stringify(payload);

const signature = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

console.log(`Posting mock push event to ${TARGET_URL}`);
console.log(`X-Hub-Signature-256: ${signature}`);

const response = await fetch(TARGET_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-GitHub-Event': 'push',
    'X-Hub-Signature-256': signature,
  },
  body,
});

const text = await response.text();
console.log(`\nResponse status : ${response.status}`);
console.log(`Response body   : ${text}`);

if (!response.ok) {
  process.exit(1);
}
