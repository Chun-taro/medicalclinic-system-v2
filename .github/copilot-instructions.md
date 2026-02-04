# Copilot instructions for medicalclinic-system-v2

Purpose
- Help AI coding agents become productive quickly: high-level architecture, run/build steps, conventions, and key integration points.

Big picture
- Monorepo-style layout: `backend/` (Express + Mongoose + Socket.IO + Passport) and `frontend/` (Create React App).
- Backend serves REST APIs under `/api/*` (see [backend/index.js](backend/index.js#L1)).
- Real-time events use Socket.IO: server exposes `global.io` and injects `req.io` into requests; frontend connects with `socket.io-client` (e.g., [frontend/src/pages/admin/AdminLayout.jsx](frontend/src/pages/admin/AdminLayout.jsx#L14)).
- Auth: JWT-based APIs plus Passport Google OAuth flow (see [backend/passport.js](backend/passport.js#L1) and callback `/api/auth/google/callback` in [backend/index.js](backend/index.js#L1)).

Key files and patterns
- Routes: [backend/routes/](backend/routes/) — thin routing, controllers handle logic (e.g., [backend/controllers/appointmentController.js](backend/controllers/appointmentController.js#L1)).
- Controllers: return JSON, use `req.io` when emitting real-time events. Search for `req.io` and `global.io` to find notification flows.
- Models: Mongoose schemas in [backend/models/](backend/models/) — use `.save()` and `.create()` patterns.
- Auth middleware: [backend/middleware/auth.js](backend/middleware/auth.js#L1) — expects `Authorization: Bearer <token>` or `req.cookies.token`; use `requireRole(...)` for role-based access.
- Notifications: [backend/utils/sendNotification.js](backend/utils/sendNotification.js#L1) uses `global.io.to(userId)` and `global.io.emit('adminNotification', ...)`.

Environment & run commands
- Backend: from repo root
  - cd backend
  - npm install
  - npm run dev (uses `nodemon`) or `npm start` for production
- Frontend: from repo root
  - cd frontend
  - npm install
  - npm start (CRA dev server) or `npm run build` to produce `/frontend/build`

Required environment variables (backend .env)
- `MONGO_URI` (required) — MongoDB connection string
- `SESSION_SECRET` — express-session secret
- `JWT_SECRET` — JWT signing secret
- `CLIENT_URL` — frontend origin (used for CORS and OAuth redirects)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — for Google OAuth
- `NODE_ENV`, `PORT` optionally used

Conventions and gotchas
- Socket rooms: users join a room named with their `userId` (see server `socket.on('join', ...)`) — emit to a single user with `global.io.to(userId)`.
- Passport serializes new Google signup objects differently (see `isNewUser` flag in [backend/passport.js](backend/passport.js#L1)).
- Auth middleware logs and rejects malformed tokens; prefer `Authorization: Bearer <token>` header for API calls.
- Static uploads served from `/uploads` (express static in [backend/index.js](backend/index.js#L1)).
- Frontend build artifacts are prebuilt under `frontend/build/` (used for deployment/static hosting).

Developer notes for changes
- When adding new real-time events, update both server emitters (use `req.io` or `global.io`) and client listeners under `frontend/src/pages/*`.
- Add new API endpoints under `backend/routes/` and implement logic in `backend/controllers/` to keep separation of concerns.

Testing & CI
- No backend test harness detected; frontend uses CRA test script (`npm test`). Add tests under `backend/tests/` or `frontend/src/__tests__/` as needed.

When in doubt
- Inspect [backend/index.js](backend/index.js#L1) to understand middleware order, session and passport setup, and route mounting.
- Search for `global.io`, `req.io`, `passport`, and `jwt.verify` to find auth/real-time hotspots.

If anything above is inaccurate or you want more examples, tell me which area to expand (auth, sockets, routes, or run/debug steps).
