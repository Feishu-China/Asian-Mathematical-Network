# 项目进度日志 (Progress Log)

> 本文件是所有 Agent 开发的 "State of the World"。在每次交接 (Handoff) 时由 Agent 追加更新。

## 当前项目状态
*   **最新版本**: V4.0-Optimized
*   **总览**: `AUTH` 与 `PROFILE` 两个 Epic 已完成。`CONF` Epic 的前后端实现 `BE-CONF-001` 与 `FE-CONF-001` 已完成并通过 smoke 验证，下一步应推进 `INT-CONF-001` 做真实联调。

---

## 📅 Handoff 历史记录

### 2026-04-20 (Session 17)
*   **Agent 角色**: Coding Agent (Frontend)
*   **完成 Feature**: `FE-CONF-001`
*   **变更记录**:
    *   为 conference feature 建立了独立的 frontend provider / mapper / schema-field 边界，并补齐了 Vitest + Testing Library 测试基线，避免页面直接耦合 raw transport payload。
    *   实现了公开会议列表页 `/conferences` 与会议详情页 `/conferences/:slug`，只展示已发布会议，并在详情页提供申请入口。
    *   实现了 Organizer 会议新建页 `/organizer/conferences/new` 与编辑页 `/organizer/conferences/:id`，覆盖草稿保存、发布前校验、发布与关闭动作。
    *   实现了 Applicant 会议申请页 `/conferences/:slug/apply`，覆盖登录前提示、草稿保存、重复草稿冲突提示，以及草稿提交闭环。
    *   使用 fake conference provider 对齐当前 backend contract 和 M2 字段子集，明确本轮不提前引入通用 form builder 或文件上传子系统。
    *   执行并通过 `conferenceMappers`、`Conferences`、`OrganizerConferenceEditor`、`ConferenceApply` 四组前端测试，执行并通过 `frontend npm run build`，并通过仓库级 `npm run test:smoke`。
    *   更新了 `v4.0` 计划中 `FE-CONF-001` 的状态为 `completed`，`passes` 维持 `false`，等待 `INT-CONF-001` 完成后再改为集成通过。
*   **下一步**: `INT-CONF-001`

### 2026-04-20 (Session 16)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-CONF-001`
*   **变更记录**:
    *   为会议工作流补齐了 Prisma 持久层与迁移，新增 `Conference`、`ConferenceStaff`、`Application`、`ApplicationStatusHistory` 模型，并将会议申请收敛到共享 `applications` 骨架下的 `conference_application` 子类型。
    *   实现了公开会议读取接口：`GET /api/v1/conferences`、`GET /api/v1/conferences/:slug`、`GET /api/v1/conferences/:id/application-form`，只暴露已发布会议，并通过 serializer 统一输出 `snake_case` transport payload。
    *   实现了 Organizer 会议生命周期接口：`POST /api/v1/organizer/conferences`、`GET/PUT /api/v1/organizer/conferences/:id`、`POST /publish`、`POST /close`，采用当前仓库可落地的最小 organizer 权限模型：创建者自动成为 conference owner，后续通过 `conference_staff` 授权。
    *   实现了 Applicant 会议申请草稿/提交接口：`POST /api/v1/conferences/:id/applications`、`PUT /api/v1/me/applications/:id/draft`、`POST /api/v1/me/applications/:id/submit`，提交时会冻结申请人的 profile snapshot，并写入一条 `application_status_history` 状态流转记录。
    *   明确记录了本轮边界：`file_ids` / 附件上传仍未实现，当前若传入非空附件会返回 `422`，等待后续文件子系统或相关 Epic 支撑。
    *   执行并通过了 `backend/tests/conferences.test.ts` 的 public / organizer / applicant 三组端到端风格测试，以及仓库级 `npm run test:smoke`。
    *   更新了 `v4.0` 计划中 `BE-CONF-001` 的状态为 `completed`，`passes` 维持 `false`，等待 `INT-CONF-001` 完成后再改为集成通过。
*   **下一步**: `FE-CONF-001`

### 2026-04-20 (Session 15)
*   **Agent 角色**: Coding Agent (Integration)
*   **完成 Feature**: `INT-PROFILE-001`
*   **变更记录**:
    *   将 profile provider 从本地 fake 实现切换为真实 API，并新增 transport mapper 将 `snake_case` 响应映射到前端 `camelCase` domain model。
    *   通过真实 backend API 验证了 `/me/profile` 的保存后回读一致性，包括 `country_code`、`personal_website`、`msc_codes` 的持久化。
    *   验证了 `/scholars/:slug` 的公开可见性和字段脱敏：公开态返回 `200` 且不包含 `coi_declaration_text`，隐藏态返回 `404`。
    *   验证了 frontend dev server 可提供 `/me/profile` 与 `/scholars/:slug` 路由，并执行通过仓库级 `npm run test:smoke`。
*   **下一步**: `PROFILE` Epic 可视为完成，可转入下一个 Epic。

### 2026-04-20 (Session 14)
*   **Agent 角色**: Coding Agent (Frontend)
*   **完成 Feature**: `FE-PROFILE-001`
*   **变更记录**:
    *   新增 `/me/profile` 私有编辑页与 `/scholars/:slug` 公开页。
    *   增加了 routePath-aware 路由注册与 profile provider 边界，前端页面不再直接绑定 raw HTTP response。
    *   使用本地 fake provider 覆盖了 loading / saving / saved / not-public 状态，并把字段映射收敛到 profile feature 层。
    *   执行并通过前端 build 与仓库级 `npm run test:smoke`。
*   **下一步**: `INT-PROFILE-001`

### 2026-04-20 (Session 13)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-PROFILE-001` follow-up review fixes
*   **变更记录**:
    *   将 `/api/v1/auth/me` 从硬编码 mock profile 切换为真实持久化 profile 返回，并为缺失 profile 的 legacy 用户复用 starter bootstrap。
    *   调整 Profile 更新规则：提交的 MSC code 会先规范化并做格式校验，再注册到本地字典；fresh DB 不再因为空 `MscCode` 表而拒绝非空 `msc_codes`。
    *   修复 legacy 用户的 email 派生 slug 泄漏风险：当用户首次以真实姓名更新并公开 profile 时，会将 slug 旋转为基于 `full_name` 的公开路径。
    *   收紧 public profile 发布条件：`is_profile_public=true` 时必须提供 `institution_name_raw`，避免公开接口泄露内部 `institution_id` 或输出空 affiliation。
    *   执行并通过 `backend` auth/profile 测试、TypeScript typecheck，以及仓库级 `npm run test:smoke`。
*   **下一步**: `FE-PROFILE-001`

### 2026-04-20 (Session 12)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-PROFILE-001`
*   **变更记录**: 
    *   将学者档案相关数据落到 Prisma 持久层，补充了 scholar-profile 模型以及 MSC 关联表。
    *   实现了 `GET /api/v1/profile/me`、`PUT /api/v1/profile/me`、`GET /api/v1/scholars/:slug`。
    *   注册流程现在会自动创建初始 profile。
    *   运行了后端 Profile 测试与仓库 smoke check，验证通过。
*   **下一步**: `FE-PROFILE-001`

### 2026-04-18 (Session 11)
*   **Agent 角色**: Initializer Agent (Architecture)
*   **完成 Feature**: 完善全局 Epic 拆解与 Feature 规划
*   **变更记录**: 
    *   读取了 `asiamath-mvp-prd-v3.2.md` 中的产品需求（包括 M1/M2/M4/M7 的轻量级设计，以及共享评审和决策骨干网）。
    *   在 `asiamath-feature-list-v4.0-optimized.json` 中为剩余的五个 Epic (`PROFILE`, `CONF`, `GRANT`, `REVIEW`, `PORTAL`) 生成了完整的特性列表。
    *   严格遵循了前、后、集成（FE/BE/INT）三步解耦范式，共计新增了 15 个 Feature。
    *   配置了明确的依赖关系（例如 `INT-GRANT-001` 必须依赖 `INT-CONF-001` 因为前置会议申请规则）。
*   **下一步**: 现在 `v4.0-optimized.json` 已经完全具备被任意多个前端、后端工程师并行接手的基础，随时可以开始并发领票开发。

### 2026-04-18 (Session 10)
*   **Agent 角色**: Coding Agent (Backend / Integration)
*   **完成 Feature**: `BE-AUTH-001` (DB 集成补充)
*   **变更记录**: 
    *   在后端项目中引入了 Prisma ORM 与 SQLite 作为真实持久化方案（替代先前的内存 mock）。
    *   根据既有 DDL 设计与 TS `models.ts` 抽象，创建了 `schema.prisma` 并定义了 `User` 表。
    *   执行了 `npx prisma migrate dev` 跑通了数据库建表流程。
    *   重构了 `src/controllers/auth.ts`，将所有用户的注册 (`register`)、登录 (`login`) 和查询 (`getMe`) 操作全部接入 Prisma Client，实现了真实的 DB 持久化写入与读取。
    *   更新了 `jest` 配置并跑通了所有集成测试，测试脚本会在运行前后清理 DB 里的测试数据。
*   **下一步**: 可以进入下一个模块开发（比如 `FE-PROFILE-001` 或 `BE-PROFILE-001`）。

### 2026-04-18 (Session 9)
*   **Agent 角色**: Coding Agent (Integration)
*   **完成 Feature**: `INT-AUTH-001` ([集成] 认证系统真实联调 (E2E))
*   **变更记录**: 
    *   在 `frontend/vite.config.ts` 中，将代理转发配置的 `target` 从 Mock 服务器的 `4010` 端口更改为真实的后端 API 端口 `3000`。
    *   本地并发启动了前端 Vite 服务器和后端 Node.js 服务。
    *   使用 E2E 测试脚本发送真实的 `/api/v1/auth/register` 请求，成功创建用户并获取了 JWT Token 以及用户信息。
    *   确认前端调用和后端处理的全链路数据流集成无误。
    *   更新了 `v4.0` 计划中 `INT-AUTH-001` 的状态为 `completed` 且 `passes: true`。
*   **下一步**: `AUTH` Epic 已经全链路完成。建议选择下一个 Epic 开始，比如开始进行 `FE-PROFILE-001` 和 `BE-PROFILE-001`。

### 2026-04-18 (Session 8)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: 优化 `test:smoke` 脚本 (补充更新)
*   **变更记录**: 
    *   移除了 `package.json` 中的 `test:smoke` 占位符命令。
    *   替换为了真实的测试指令：`npm run test:frontend && npm run test:backend`。现在每次启动前执行 `npm run test:smoke` 时，都会真实去执行前端的 `build` 以及后端的 `jest` 单元/集成测试。
    *   成功运行了优化后的 Smoke Test，验证通过，确保后续的 Agent 能够依靠这个脚本真正检验项目的健康状态。
*   **下一步**: 可以继续推进前端或后端的未完成模块开发，或进入集成测试阶段 `INT-AUTH-001`。

### 2026-04-18 (Session 7)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-AUTH-001` ([后端] 认证系统 API 实现)
*   **变更记录**: 
    *   在 `backend/` 目录下初始化了 Node.js + TypeScript 后端项目。
    *   安装了 `express`, `cors`, `jsonwebtoken`, `bcryptjs`, `uuid` 等核心依赖。
    *   实现了认证系统的 Controller (`register`, `login`, `getMe`)，并临时使用内存数组（模拟 DB）作为存储。
    *   根据 OpenAPI 契约配置了 `/api/v1/auth/*` 路由。
    *   使用 `jest` 和 `supertest` 编写了完整的后端单元/集成测试。
    *   运行 `npm run test`，所有用例通过。
    *   更新了 `v4.0` 计划中 `BE-AUTH-001` 的状态为 `completed` 且 `passes: true`。
*   **下一步**: 可以开始前后端真实的集成联调 `INT-AUTH-001`，或者继续独立开发前端/后端的其他模块（如 Profile 模块）。

### 2026-04-18 (Session 6)
*   **Agent 角色**: Coding Agent (Frontend)
*   **完成 Feature**: `FE-AUTH-001` ([前端] 认证系统 UI 基于 Mock)
*   **变更记录**: 
    *   在 `frontend/` 目录下初始化了基于 Vite + React + TypeScript 的前端项目。
    *   配置了 `vite.config.ts` 以将 `/api/v1` 请求代理到 `http://localhost:4010` (Mock 服务)。
    *   创建了使用 Axios 的 `src/api/auth.ts` 接口调用，并实现了包含样式 (CSS) 的 `Login`、`Register` 和 `Dashboard` 页面。
    *   在 `App.tsx` 和 `main.tsx` 中配置了 React Router 路由。
    *   成功运行了 `npm run build`，确认代码结构与类型检查无误。
    *   更新了 `v4.0` 计划中 `FE-AUTH-001` 的状态为 `completed` 且 `passes: true`。
*   **下一步**: 可以开始后端并行开发 `BE-AUTH-001`，或者继续开发前端的 `FE-PROFILE-001` 等业务模块。

### 2026-04-18 (Session 5)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: `MOCK-001` (Mock API 服务器搭建)
*   **变更记录**: 
    *   在 `package.json` 中配置了 `npm run mock` 命令，使用 `mockoon-cli` 基于 OpenAPI yaml 文件启动 mock 服务器。
    *   创建了 `mocks/fixtures` 目录结构和 `mocks/README.md`，记录了自动生成的数据规则。
    *   测试了 Mock 服务器运行，并成功用 `curl` 验证了 `/api/v1/conferences` 接口的动态模拟响应。
    *   更新了 `v4.0` 计划中 `MOCK-001` 的状态为 `completed` 且 `passes: true`。
*   **下一步**: 需要执行前端与后端的并行开发。建议前端开发开始执行 `FE-AUTH-001` ([前端] 认证系统 UI 基于 Mock)，同时后端可以独立执行 `BE-AUTH-001`。

### 2026-04-18 (Session 4)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: `CONTRACT-002` (API OpenAPI 契约定义)
*   **变更记录**: 
    *   基于 `src/types/models.ts`，创建了完整的 OpenAPI 3.0.3 规范文档 `docs/specs/openapi.yaml`。
    *   定义了 Authentication 相关的 endpoints (`/auth/login`, `/auth/register`, `/auth/me`)。
    *   定义了核心业务 endpoints（例如 `/profiles/me`, `/conferences`），并集成了所有的 TS 枚举和 Schema。
    *   通过 `@redocly/cli` 工具对 `openapi.yaml` 进行了语法 lint 校验，保证 API 描述的合法性。
    *   更新了 `v4.0` 计划中 `CONTRACT-002` 的状态为 `completed` 且 `passes: true`。
*   **下一步**: 需要执行 `MOCK-001` (Mock API 服务器搭建)，基于今天生成的 `openapi.yaml` 来配置 Mock 服务（可使用 Prism 或 json-server），供前端独立调用。

### 2026-04-18 (Session 3)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: `CONTRACT-001` (核心数据模型与 Schema)
*   **变更记录**: 
    *   通过读取 `database/ddl/asiamath-database-ddl-v1.1.sql` 和产品文档，提取了所有的核心枚举类型和数据表结构。
    *   创建了 `src/types/models.ts` 文件，将 SQL 结构转化为严格的 TypeScript Interfaces。
    *   这些 Interface 将作为后续 OpenAPI 和 Mock Server 的基准数据结构。
    *   更新了 `v4.0` 计划中 `CONTRACT-001` 的状态为 `completed`。
*   **下一步**: 需要执行 `CONTRACT-002` (API OpenAPI 契约定义)，也就是基于刚才生成的 `models.ts` 编写 OpenAPI / Swagger 规范文件（yaml 或 json 格式）。

### 2026-04-18 (Session 2)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: `HARNESS-002` (创建 Smoke Test Checklist)
*   **变更记录**: 
    *   创建了基础的 `package.json`，引入了 `"test:smoke"` 占位脚本，确立了项目基于 Node.js 生态的命令规范。
    *   创建了 `SMOKE_TEST_CHECKLIST.md`，明确了后续有真实前端代码后，如何验证 "Home Page" 和 "Login Page"。
    *   执行了 `npm run test:smoke`，结果为 `passed`。
    *   更新了 `v4.0` 计划中 `HARNESS-002` 的状态为 `completed`。
*   **下一步**: 需要执行 `CONTRACT-001` (核心数据模型与 Schema)，包括完成数据库的完整设计（可参考现有 DDL）并建立 TypeScript Interfaces 供全栈使用。

### 2026-04-18 (Session 1)
*   **Agent 角色**: Initializer Agent
*   **完成 Feature**: `HARNESS-001` (建立进度日志与 Sprint 契约模板)
*   **变更记录**: 
    *   创建了 `SPRINT_CONTRACT_TEMPLATE.md` (包含 Sprint Contract 和 Handoff Log 模板)。
    *   创建了本文件 `PROGRESS.md`。
    *   更新了 `v4.0` 计划中 `HARNESS-001` 的状态为 `completed`。
*   **下一步**: 需要执行 `HARNESS-002`，建立项目的 Smoke Test 流程（如初始化 package.json 并在其中设置简单的 test 脚本）。
