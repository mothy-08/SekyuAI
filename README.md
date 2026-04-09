# SekyuAI

GitHub webhook security automation that watches repositories, patches changed `.js` files with Gemini AI, and opens pull requests.

## Stack

- **Frontend**: React + Vite
- **Backend**: Node.js 18+ + Express (ES modules)
- **AI**: Gemini via `@google/genai`
- **GitHub API**: GitHub REST via native `fetch`
- **Persistence**: Local JSON (`watchlist.json`)

## Project Structure

```
sekyu-ai/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── watchlist.json
│   ├── routes/
│   │   ├── watchlist.js
│   │   └── webhook.js
│   └── services/
│       ├── github.js
│       └── gemini.js
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── AddRepo.jsx
│   │       └── RepoList.jsx
│   └── vite.config.js
├── scripts/
│   └── test-webhook.js
├── .env.example
├── package.json
└── README.md
```

---

## Installation & Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/SekyuAI.git
cd SekyuAI
```

### 2. Install all dependencies

```bash
# Root dev tooling (concurrently)
npm install

# Backend and frontend dependencies
npm run install:all
```

### 3. Configure environment variables

```bash
cp .env.example backend/.env
```

Open `backend/.env` and fill in every value:

```
GITHUB_PAT=your_github_personal_access_token_here
GEMINI_API_KEY=your_gemini_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here
PORT=3000
```

| Variable | Description |
|---|---|
| `GITHUB_PAT` | GitHub Personal Access Token with `repo` scope |
| `GEMINI_API_KEY` | Google Gemini API key |
| `WEBHOOK_SECRET` | Random secret string used to validate HMAC-signed webhook payloads |
| `PORT` | Backend server port (default: `3000`) |

---

## Running the Application

Start both the backend and frontend with a single command from the project root:

```bash
npm run dev
```

- Backend runs at **http://localhost:3000**
- Frontend runs at **http://localhost:5173** (Vite default)

---

## ngrok Setup (Exposing localhost to GitHub)

GitHub must be able to reach your local server to deliver webhook events. Use [ngrok](https://ngrok.com/) to create a public tunnel.

### 1. Install ngrok

Follow the instructions at https://ngrok.com/download, or with Homebrew:

```bash
brew install ngrok/ngrok/ngrok
```

### 2. Start the tunnel

In a separate terminal (while `npm run dev` is running):

```bash
ngrok http 3000
```

ngrok will display a **Forwarding** URL such as:

```
Forwarding  https://a1b2c3d4.ngrok-free.app -> http://localhost:3000
```

Copy this URL — you will need it in the next step.

---

## GitHub Webhook Configuration

1. Go to your GitHub repository → **Settings** → **Webhooks** → **Add webhook**.
2. Set the fields as follows:

   | Field | Value |
   |---|---|
   | **Payload URL** | `<ngrok-url>/webhook` (e.g. `https://a1b2c3d4.ngrok-free.app/webhook`) |
   | **Content type** | `application/json` |
   | **Secret** | The same value you used for `WEBHOOK_SECRET` in `backend/.env` |
   | **Which events?** | Select **Let me select individual events**, then tick only **Pushes** |

3. Click **Add webhook**.

GitHub will immediately send a `ping` event; the backend will respond with `200 OK`.

> **Security note:** Every incoming webhook payload is validated against the `X-Hub-Signature-256` header using HMAC SHA-256 with your `WEBHOOK_SECRET`. Requests with an invalid or missing signature are rejected with `401 Unauthorized`.

---

## API Smoke Tests

Use these `curl` commands to verify the watchlist API while the backend is running.

### GET /api/watchlist — list watched repositories

```bash
curl -s http://localhost:3000/api/watchlist | jq
```

### POST /api/watchlist — add a repository

```bash
curl -s -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"repo": "owner/repository-name"}' | jq
```

### DELETE /api/watchlist/:repo — remove a repository

```bash
curl -s -X DELETE "http://localhost:3000/api/watchlist/owner%2Frepository-name" | jq
```

---

## Local Webhook Test Script

You can simulate a GitHub push event without touching GitHub:

```bash
node scripts/test-webhook.js
```

The script reads `WEBHOOK_SECRET` from `backend/.env` (or from the environment), builds a mock push payload, signs it with HMAC SHA-256, and POSTs it to `http://localhost:3000/webhook`.

---

## Demo Workflow

Follow these steps for a full end-to-end demonstration:

### Step 1 — Add a repository to the watchlist

```bash
curl -s -X POST http://localhost:3000/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{"repo": "your-username/your-repo"}' | jq
```

Confirm it appears in the list:

```bash
curl -s http://localhost:3000/api/watchlist | jq
```

### Step 2 — Push code to the watched repository

In the watched repository, make a change to any `.js` file and push it:

```bash
echo "// demo change" >> src/index.js
git add src/index.js
git commit -m "demo: trigger SekyuAI"
git push origin main
```

GitHub delivers a `push` event to your ngrok URL → backend validates the HMAC signature → Gemini reviews and patches the changed `.js` files.

### Step 3 — Review the automated pull request

Open the watched repository on GitHub. SekyuAI will have opened a new pull request containing the AI-generated security patches. Review the diff and merge if appropriate.