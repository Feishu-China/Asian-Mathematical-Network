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

当开始特定模块的开发，需要真实启动本地服务时，请确保：

- [ ] **前端服务启动**:
  - 运行 `cd frontend && npm run dev` 能够成功启动 Vite。
  - 访问 `http://localhost:5173/` 无白屏报错。
- [ ] **后端服务启动**:
  - 运行 `cd backend && npm run dev` 能够成功启动 Nodemon。
  - 控制台打印 `Server is running on port 3000` 无崩溃。
- [ ] **Mock 服务启动** (仅纯前端开发时适用):
  - 运行 `npm run mock` 能够成功挂载 OpenAPI 契约，不抛出 schema 校验错误。
- [ ] **接口健康检查**:
  - `curl -i http://localhost:3000/api/v1/auth/me` 或相关业务接口，确认能够收到 HTTP 响应（例如未登录时返回 `401`，而不是连接失败）。

## 3. 日志记录
- [ ] 在 `PROGRESS.md` 的当次会话记录中，必须显式声明：“Smoke Test 执行通过”。
