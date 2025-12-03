# AI Translation App (Gemini 2.5) - Downloadable Project

**What's included**
- `backend/` - Node.js + Express backend with `/api/translate` endpoint (uses GEMINI_API_KEY from env)
- `frontend/` - Single-file responsive UI (HTML + Tailwind CDN + JS) that talks to backend
- `.env.example` - example env file (DO NOT COMMIT real API KEYS)
- `package.json` - for running the backend
- `LICENSE` - MIT

**Important security note**

**How to run (locally)**
1. Install Node (v18+ recommended).
2. Open a terminal in the `backend` folder.
3. Run `npm install`
4. Create a `.env` file with `GEMINI_API_KEY="YOUR_KEY"`
5. Start the server: `npm start`

**Quick smoke tests (confirm API behaviour)**

- Calling the server without required fields returns 400. Example (curl):

```bash
curl -X POST http://localhost:3000/api/translate -H "Content-Type: application/json" -d '{"key":"value"}'
# => {"error":"text and target required"}
```

- Send a proper request (the server will forward to the configured model API). If your API key is not authorized to call the model endpoint you'll see an upstream 401/403 error — check the cloud console and key permissions.

```bash
curl -X POST http://localhost:3000/api/translate -H "Content-Type: application/json" -d '{"text":"Hello","target":"es"}'
```

Platform-friendly example scripts are included at `backend/curl_examples`:

- `test_translate.ps1` - PowerShell
- `test_translate.cmd` - Windows cmd
- `test_translate.sh` - POSIX / WSL / git-bash

Security reminder: Do NOT commit a real API key to source control. Add `backend/.env` to `.gitignore` and keep keys out of your repo.

Authentication tips (common 401 errors)
- If you see an error like: {"error":{"code":401,"message":"Request had invalid authentication credentials..."}} it means the server's request to the model provider was rejected.

	There are two common authentication styles for Google Cloud endpoints:

	1) API Key (simple):
		 - If you have an API key (usually created in Google Cloud console), set:
			 GEMINI_API_KEY=YOUR_API_KEY
			 USE_API_KEY=true
		 - The backend will attach the API key as ?key=YOUR_API_KEY when calling the API.

	2) OAuth / Bearer token (recommended for production/service accounts):
		 - Obtain an OAuth 2 access token (or use a service account and Application Default Credentials). Put the bearer token in GEMINI_API_KEY, and leave USE_API_KEY undefined or false.
		 - The backend will send Authorization: Bearer <token>.

	Choose the method that matches the credentials you created in your cloud provider. For local testing the API key option (USE_API_KEY=true) is the easiest.
**Notes about Gemini API**
- This project demonstrates how to call a generative language model endpoint.
- The backend uses the **Google Generative Language** REST shape as an example. Adjust the request shape if your provider's API differs.

Model & endpoint configuration
- If you get an upstream 404 (Requested entity was not found) this usually means the model name in the backend doesn't exist for your account or the API base path is wrong.

	- You can set `MODEL_NAME` in `backend/.env` to a model your account supports. Example:
		MODEL_NAME=text-bison-001

	- If you use a custom endpoint or different API version, you can override `API_BASE_URL` in `.env` as well.

	- After changing `.env`, restart the backend server to pick up the new values.

---

## Deployment / CI (Cloud Run + GitHub Actions)

This repo includes a ready-to-use deployment setup that targets Google Cloud Run and GitHub Actions.

What was added:

- `backend/Dockerfile` — container image for the backend.
- `.github/workflows/ci.yml` — CI smoke test; starts the backend and verifies the input-validation behavior.
- `.github/workflows/deploy.yml` — builds/pushes an image and deploys to Cloud Run (uses GitHub Secrets for credentials).
- `backend/deploy.sh` — convenience script for local deploy using the gcloud SDK.

Required GitHub repository secrets (set in Settings → Secrets):

- `GCP_SA_KEY` — JSON service account key (Cloud Build & Cloud Run permissions).
- `GCP_PROJECT` — your Google Cloud project id.
- `GCP_REGION` — region for Cloud Run (e.g., `us-central1`).
- Optional: `USE_API_KEY`, `MODEL_NAME` — these can be provided as secrets to pass into the deployed container.

How to deploy locally using the helper script (example):

```bash
# Authenticate locally (gcloud SDK)
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build + deploy (replace YOUR_PROJECT_ID/REGION)
GCP_PROJECT=YOUR_PROJECT_ID GCP_REGION=us-central1 ./backend/deploy.sh
```

How the GitHub Actions workflow works

- The CI workflow starts the backend in the runner and verifies a small smoke test (no API key required for that check).
- The deploy workflow uses the `GCP_SA_KEY` secret to authenticate, builds the container via Cloud Build, and deploys to Cloud Run. It prints the service URL at the end.

Security reminder: Keep your service account key and API keys in secrets only; rotate credentials if they've been committed accidentally.

