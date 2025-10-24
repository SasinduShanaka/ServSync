# ServSync
Smart Appointment & Queue Management System for NITF

This repository contains ServSync — a queue and appointment management system with a Node.js/Express backend and a Vite + React frontend. It includes real-time queue updates (Socket.IO), SMS worker integration, file uploads, and admin/customer flows.

## Repository layout

 - `backend/` — Express API, MongoDB models, workers and routes. Uses ES modules; `server.js` is the entry point.
	 - `scripts/` — seed scripts (e.g., `seed-banks.js`, `seed-branches.js`)
	 - `workers/` — background workers (SMS, etc.)
	 - `routes/`, `controllers/`, `services/`, `models/`
 - `frontend/` — Vite + React app (Tailwind used). Dev server runs with `vite`.
 - `clean/` — local cache-like folders used by this repo (already ignored by `.gitignore`).
 - `uploads/` — runtime uploaded files (served by backend). This directory is ignored and created at runtime.
 - `ecosystem.config.js`, `deploy.sh`, `CPANEL-DEPLOYMENT.md`, `DEPLOYMENT.md` — deployment helper files.

## Quick start (development)

Requirements
 - Node.js (v16+ recommended)
 - npm (or yarn / pnpm)
 - MongoDB (Atlas or local)

1. Clone the repository

	 git clone <repo-url>
	 cd ServSync

2. Backend setup

	 cd backend
	 npm install

	 - Copy `.env.example` (if present) to `.env` and set required variables (see Environment section below).
	 - Seed sample data (optional):

		 npm run seed:banks
		 npm run seed:branches

	 - Start in development (uses nodemon):

		 npm run dev

	 The server default port is `5000` (controlled by `PORT` env var). The backend serves uploaded files from the `uploads/` folder and mounts many APIs under `/api`.

3. Frontend setup

	 cd frontend
	 npm install
	 npm run dev

	 Vite runs on `http://localhost:5173` by default. The frontend proxies or calls backend APIs at `http://localhost:5000` unless you change `FRONTEND_ORIGIN` in the backend `.env` or adjust `frontend/vite.config.js`.

4. Open the app

	 - Frontend: http://localhost:5173
	 - Backend API root for a quick check: http://localhost:5000/ (returns a simple running message)

## Important scripts

 - Backend
	 - `npm run dev` — start backend with nodemon
	 - `npm run seed:banks` — seed banks data
	 - `npm run seed:branches` — seed branches data
 - Frontend
	 - `npm run dev` — start Vite dev server
	 - `npm run build` — production build
	 - `npm run preview` — preview built app

## Environment variables (key ones used by backend)

Create `backend/.env` with values appropriate for your environment. Main variables the backend expects:

 - `MONGO_URI` — MongoDB connection string (required)
 - `PORT` — server port (default: 5000)
 - `SESSION_SECRET` — secret for express-session (set in production)
 - `FRONTEND_ORIGIN` — the allowed frontend origin(s) for CORS during development
 - `UPLOAD_DIR` — directory for uploaded files (default: `uploads`)
 - `NOTIFYLK_USER_ID`, `NOTIFYLK_API_KEY`, `NOTIFYLK_SENDER_ID` — SMS gateway credentials (used by SMS worker)
 - `SMS_WORKER_ENABLED` — `false` to disable SMS worker; otherwise enabled by default
 - `SMS_WORKER_INTERVAL_MS` — control worker polling interval

Check `backend/README.md` for a short development checklist and troubleshooting notes.

## Deployment notes

 - This repo includes `ecosystem.config.js` (for PM2) and `deploy.sh` to assist with deployments. There's also `DEPLOYMENT.md` and `CPANEL-DEPLOYMENT.md` with environment-specific guidance.
 - Ensure environment variables (especially `MONGO_URI` and `SESSION_SECRET`) are set in your deployment environment.
 - Serve the built frontend (from `frontend/dist`) with a static server or configure Nginx to serve it and proxy API requests to the backend.

## Security & operational tips

 - Don't commit `.env` files. The repo `.gitignore` already ignores `.env` and runtime directories like `uploads/`.
 - Use lockfiles (package-lock.json / yarn.lock) if you want reproducible installs. Decide whether subpackage lockfiles should be committed — current setup has some lockfiles listed in `.gitignore`.

## Contributing

1. Fork and create a topic branch
2. Add tests for new features where applicable
3. Keep changes focused and provide a short PR description

## License

This project contains a `LICENSE` file at the repository root. Review it for license terms.

## Where to look next

 - Backend entry: `backend/server.js` — shows required env vars, session setup, routes, and background worker startup.
 - Frontend entry: `frontend/src/main.jsx` and `frontend/vite.config.js` — Vite dev server and configuration.

If you want, I can open a PR with this README update, add a `README` to `frontend/` (if you want a focused frontend guide), or standardize lockfile policy across the monorepo. Which would you like me to do next?
