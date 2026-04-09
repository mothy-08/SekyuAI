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
├── .env.example
└── README.md
```

## Setup

1. Copy `.env.example` to `.env` in the `backend/` directory and fill in the values.
2. Install backend dependencies: `cd backend && npm install`
3. Install frontend dependencies: `cd frontend && npm install`
4. Start the backend: `cd backend && npm start`
5. Start the frontend: `cd frontend && npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `GITHUB_PAT` | GitHub Personal Access Token |
| `GEMINI_API_KEY` | Google Gemini API key |
| `WEBHOOK_SECRET` | Secret for validating GitHub webhook payloads |
| `PORT` | Backend server port (default: 3000) |

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/watchlist` | List watched repositories |
| `POST` | `/api/watchlist` | Add a repository to the watchlist |
| `DELETE` | `/api/watchlist/:repo` | Remove a repository from the watchlist |
| `POST` | `/webhook` | Receive GitHub push events and trigger patching |