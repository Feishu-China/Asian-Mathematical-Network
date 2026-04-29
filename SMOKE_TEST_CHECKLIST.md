# 💨 Smoke Test Checklist (冒烟测试清单)

> **目标**: 本清单用于 Agent 在开发一个 Feature 的“启动时”和“交付前”验证项目处于健康的 Clean State。
> **要求**: 在任何一个 Coding Agent 进行实现 (Step 3) 之前，必须执行自动化检查。若失败，必须先修复或停止。

## 1. 自动化环境检查 (Sanity Test)
每次接手开发或提交代码前，必须确保自动化构建和测试通过，且开发环境基础依赖正常：
- [ ] 运行完整的自动化冒烟脚本：
  ```bash
  npm run test:smoke
  ```
  *(注：该脚本将自动验证前端构建、后端单元测试，以及验证前后端 `npm run dev` 依赖项是否完好。)*

## 2. 运行时手动检查 (在开发和联调期间)

开始前先明确本次要跑哪一种模式，不要把 `5173 + proxy` 和 `5175 + direct API base` 混在一起。

### 2.1 默认本地开发（proxy 模式）

- [ ] **后端服务启动**:
  - 运行 `cd backend && npm run dev` 能够成功启动 Nodemon。
  - 控制台打印 `Server is running on port 3000` 无崩溃。
- [ ] **前端服务启动**:
  - 运行 `cd frontend && npm run dev` 能够成功启动 Vite。
  - 访问 `http://127.0.0.1:5173/` 无白屏报错。
- [ ] **API wiring 正确**:
  - `VITE_API_BASE_URL` 保持未设置。
  - 前端 `/api/v1` 请求通过 Vite proxy 转发到 `http://127.0.0.1:3000`。
- [ ] **接口健康检查**:
  - `curl -i http://127.0.0.1:3000/api/v1/auth/me` 或相关业务接口，确认能够收到 HTTP 响应（例如未登录时返回 `401`，而不是连接失败）。
- [ ] **Mock 服务启动** (仅纯前端开发时适用):
  - 运行 `npm run mock` 能够成功挂载 OpenAPI 契约，不抛出 schema 校验错误。

### 2.2 Real-flow / acceptance（直连 API base 模式）

- [ ] **稳定 backend 启动**:
  - 先运行 `npm run build --workspace backend`。
  - 再在 `backend/` 目录运行 `PORT=3001 npm run start`。
  - 确认稳定 backend 监听 `http://127.0.0.1:3001`。
- [ ] **专用 frontend 启动**:
  - 运行 `VITE_API_BASE_URL="http://127.0.0.1:3001/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5175`。
  - 访问 `http://127.0.0.1:5175/` 无白屏报错。
- [ ] **接口健康检查**:
  - `curl -i http://127.0.0.1:3001/api/v1/auth/me` 或相关业务接口，确认能够收到 HTTP 响应。
- [ ] **脚本口径明确**:
  - `npm run test:portal:int` 与 `npm run test:grant:int` 默认仍可跑在 `3000/5173` 本地开发口径。
  - 做 real-flow 验收时，请显式覆盖 `*_BACKEND_ORIGIN=http://127.0.0.1:3001` 与 `*_FRONTEND_ORIGIN=http://127.0.0.1:5175`。

### 2.3 选择原则

- [ ] **什么时候用 proxy 模式**:
  - 纯 UI 开发、日常本地联调、以及你希望用最轻量启动方式时。
- [ ] **什么时候用直连 API base 模式**:
  - browser acceptance、真实登录/申请链路、以及排查 `3000/3001` 或 `5173/5175` 口径差异带来的假问题时。

## 3. 日志记录
- [ ] 在 `PROGRESS.md` 的当次会话记录中，必须显式声明：“Smoke Test 执行通过”。
