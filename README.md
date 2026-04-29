# Asiamath V4.0 - Distributed Development Guide

Welcome to the **Asiamath** repository! 

This project has been explicitly designed and refactored for **Distributed (Concurrent) Development**. Multiple engineers or AI Agents can work on this repository simultaneously without ever running into a git merge conflict.

## 🏗️ Architecture & Zero-Conflict Routing

We have adopted an auto-discovery routing architecture for both Frontend and Backend to ensure you do not need to modify shared configuration files.

### 🌐 Frontend (`/frontend`)
- **Tech Stack:** React + Vite + TypeScript
- **Zero-Conflict Routing:** You **do not** need to edit `App.tsx` or any central router file.
- **How to add a new page:**
  Simply create a new `.tsx` file inside `frontend/src/pages/`.
  For example, creating `frontend/src/pages/Profile.tsx` will automatically register the route `http://localhost:5173/profile`.
- **To Start (default UI dev / proxy mode):** `cd frontend && npm install && npm run dev`
- **Default local port:** `http://127.0.0.1:5173`

### ⚙️ Backend (`/backend`)
- **Tech Stack:** Node.js + Express + Prisma (PostgreSQL) + Jest
- **Zero-Conflict Routing:** You **do not** need to edit `app.ts` to register your new controllers.
- **How to add a new API endpoint:**
  Simply create a new `.ts` file inside `backend/src/routes/`.
  For example, creating `backend/src/routes/profile.ts` will automatically mount all your routes under `http://127.0.0.1:3000/api/v1/profile` in default local dev.
- **To Start (default backend dev):** `cd backend && npm install && npm run dev`
- **Default local port:** `http://127.0.0.1:3000`

## 🔁 Local Run Modes

Use one of these two modes explicitly. Do not mix them during debugging or acceptance.

### 1. Default local development (`5173 + proxy -> 3000`)
- **Use this when:** you want the lightest frontend/backend loop or are doing routine UI work.
- **Backend:** `cd backend && npm run dev`
- **Frontend:** `cd frontend && npm run dev`
- **Browser:** `http://127.0.0.1:5173`
- **API wiring:** leave `VITE_API_BASE_URL` unset so frontend requests to `/api/v1` go through the Vite proxy to `http://127.0.0.1:3000`

### 2. Real-flow / acceptance (`5175 + direct API base -> 3001`)
- **Use this when:** you are running browser acceptance or `npm run test:portal:int` / `npm run test:grant:int`, or when a `3000/3001` mismatch could create false failures.
- **Backend:** run `npm run build --workspace backend`, then `cd backend && PORT=3001 npm run start`
- **Frontend:** run `VITE_API_BASE_URL="http://127.0.0.1:3001/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5175`
- **Browser target:** `http://127.0.0.1:5175`
- **Why this mode exists:** it bypasses the default proxy and talks directly to the stable local backend instance on `3001`

### 3. Which mode should I pick?
- Use **default local development** for routine UI work and faster iteration.
- Use **real-flow / acceptance** for real auth/application flows, browser acceptance, and any run where frontend/backend ports need to be explicit instead of inferred through the proxy.

## 🛠️ The Development Workflow (Shift Work)

We follow the **Four-layer staggered parallel development** model. When claiming a task from the JSON planner (`docs/planning/asiamath-feature-list-v4.0-optimized.json`), please adhere to the following workflow:

1. **Verify (Smoke Test):** 
   Always run `npm run test:smoke` at the root of the project *before* and *after* your changes. This ensures the codebase is in a Clean State.
2. **Implement:** 
   Write your code within your isolated files (`frontend/src/pages/YourFeature.tsx` or `backend/src/routes/yourfeature.ts`).
3. **Test:** 
   Write Jest tests in `backend/tests/` for your backend features.
4. **Handoff:** 
   Update your feature's status in `asiamath-feature-list-v4.0-optimized.json` to `"status": "completed"` and `"passes": true`. Finally, append your session summary to `PROGRESS.md`.

## 📂 Full Repository Structure & Roles

This repository is more than just code. It contains the product requirements, system contracts, shared types, and engineering rules that make distributed development possible.

Here is the layout and what each folder is used for:

```text
/ASIAN-MATH
├── 📄 AGENT_HARNESS.md         # 🤖 MANDATORY rules & discipline for AI Agents (The "Shift Work" model)
├── 📄 PROGRESS.md              # 📝 Changelog & Handoff log (Updated after EVERY feature completion)
├── 📄 SMOKE_TEST_CHECKLIST.md  # ✅ Manual/Automated Smoke Test guidelines
├── 📄 package.json             # ⚙️ Root scripts (e.g., `npm run test:smoke`, `npm run mock`)
│
├── 📁 docs/                    # 📚 The single source of truth for the project
│   ├── planning/               # 🗺️ Feature List (JSON) & Sprint Contracts (Who does what and when)
│   ├── product/                # 💡 PRDs (Product Requirements Documents)
│   └── specs/                  # 📜 System Contracts (OpenAPI Swagger YAML, Architecture Specs)
│
├── 📁 database/                # 🗄️ Raw SQL definitions
│   └── ddl/                    # 🏗️ DDL (Data Definition Language) files for creating tables
│
├── 📁 packages/                # 📦 Shared workspace packages
│   └── shared/                 # 🧱 Shared TypeScript models consumed by frontend and backend
│
├── 📁 mocks/                   # 🤡 Mock API server configurations and test data fixtures
│
├── 📁 frontend/                # 💻 React + Vite + TS (Frontend App)
│   ├── src/pages/              # 📄 Zero-Conflict Routing: Add a `.tsx` here, it auto-mounts
│   └── vite.config.ts          # 🔌 Vite config (handles proxying to mock/backend servers)
│
└── 📁 backend/                 # ⚙️ Node.js + Express + Prisma (Backend API)
    ├── prisma/                 # 🗃️ Prisma schema and migrations (local dev DB is generated, not versioned)
    ├── src/routes/             # 🛣️ Zero-Conflict Routing: Add a `.ts` here, it auto-mounts
    ├── src/controllers/        # 🧠 Business logic (called by routes)
    └── tests/                  # 🧪 Jest E2E and Unit Tests
```

### 🚦 Where do I start? (For New Engineers)
1. **Read the Rules**: Read `AGENT_HARNESS.md` to understand how we work (One Feature at a time, Smoke Tests).
2. **Find a Task**: Open `docs/planning/asiamath-feature-list-v4.0-optimized.json` and find a feature marked `"status": "not_started"`.
3. **Read the Contract**: Check `docs/specs/openapi.yaml` and `packages/shared/src/models.ts` to understand the data structure you need to implement.
4. **Develop**: Go to `frontend/` or `backend/` and start coding.

Happy coding! If you follow the isolated file structure, you will never see a merge conflict.
