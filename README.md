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
- **To Start:** `cd frontend && npm install && npm run dev`

### ⚙️ Backend (`/backend`)
- **Tech Stack:** Node.js + Express + Prisma (SQLite) + Jest
- **Zero-Conflict Routing:** You **do not** need to edit `app.ts` to register your new controllers.
- **How to add a new API endpoint:**
  Simply create a new `.ts` file inside `backend/src/routes/`.
  For example, creating `backend/src/routes/profile.ts` will automatically mount all your routes under `http://localhost:3000/api/v1/profile`.
- **To Start:** `cd backend && npm install && npm run dev`

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
├── 📁 src/                     # 🔗 Shared Code (Used by BOTH frontend and backend)
│   └── types/                  # 🧱 Shared TypeScript models (e.g., `models.ts` defining User, Profile)
│
├── 📁 mocks/                   # 🤡 Mock API server configurations and test data fixtures
│
├── 📁 frontend/                # 💻 React + Vite + TS (Frontend App)
│   ├── src/pages/              # 📄 Zero-Conflict Routing: Add a `.tsx` here, it auto-mounts
│   └── vite.config.ts          # 🔌 Vite config (handles proxying to mock/backend servers)
│
└── 📁 backend/                 # ⚙️ Node.js + Express + Prisma (Backend API)
    ├── prisma/                 # 🗃️ Prisma ORM schema & SQLite database file
    ├── src/routes/             # 🛣️ Zero-Conflict Routing: Add a `.ts` here, it auto-mounts
    ├── src/controllers/        # 🧠 Business logic (called by routes)
    └── tests/                  # 🧪 Jest E2E and Unit Tests
```

### 🚦 Where do I start? (For New Engineers)
1. **Read the Rules**: Read `AGENT_HARNESS.md` to understand how we work (One Feature at a time, Smoke Tests).
2. **Find a Task**: Open `docs/planning/asiamath-feature-list-v4.0-optimized.json` and find a feature marked `"status": "not_started"`.
3. **Read the Contract**: Check `docs/specs/openapi.yaml` and `src/types/models.ts` to understand the data structure you need to implement.
4. **Develop**: Go to `frontend/` or `backend/` and start coding.

Happy coding! If you follow the isolated file structure, you will never see a merge conflict.