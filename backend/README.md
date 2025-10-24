ServSync backend — local development

1) Create a .env file
- Copy `.env.example` to `.env` in the `backend/` folder and fill in your MongoDB Atlas connection string under `MONGO_URI`.

2) Install dependencies
- From the `backend/` folder run:

```
npm install
```

3) Start the server (development)

```
npm run dev
```

4) Verify
- The server logs should show `MongoDB Connected: <host>` and `Server is running on http://localhost:<PORT>`.
- The frontend (Vite) proxies `/api` to `http://localhost:5000` by default. If your backend uses a different port, update `frontend/vite.config.js` or set `FRONTEND_ORIGIN` in the `.env` accordingly.

5) Troubleshooting
- If the server exits with `MONGO_URI is not defined`, ensure `.env` exists and contains a valid `MONGO_URI`.
- For MongoDB connection errors, confirm Atlas network access (IP whitelist) and credentials.
- If CORS errors appear in browser console, verify `FRONTEND_ORIGIN` in `.env` matches the Vite dev URL.
