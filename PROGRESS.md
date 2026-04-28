# 项目进度日志 (Progress Log)

> 本文件是所有 Agent 开发的 "State of the World"。在每次交接 (Handoff) 时由 Agent 追加更新。

## 当前项目状态
*   **最新版本**: V4.0-Optimized
*   **总览**: `AUTH`、`PROFILE`、`CONF`、`GRANT`、`REVIEW` 与 `PORTAL` 六个 Epic 现在都已完成到当前 feature-list 口径；`/portal`、`/me/applications`、grant post-visit report、以及 public scholar directory / portal scholar teaser 的 real-data 链路都已落地并完成本地验证。当前剩余事项已不再是 feature-list 缺口，主要是后续如有需要再单独收口本地 dev proxy 默认仍指向 `3000` 的开发体验差异。

---

## 📅 Handoff 历史记录

### 2026-04-28 (Session 45)
*   **Agent 角色**: Coding Agent (`INT-PROFILE-002` scholar directory real-data integration)
*   **关联 Feature**: `INT-PROFILE-002`
*   **问题现象**:
    *   `/scholars` 与 `/portal` 的 scholar teaser 虽然界面已经存在，但 `frontend/src/features/profile/scholarDirectoryProvider.ts` 在 real mode 下仍直接返回 `directorySeed`，导致 public scholar directory 不是实际公开 profile 数据。
    *   后端当前只有 `GET /api/v1/scholars/:slug` public detail route，没有 public scholar directory list endpoint，因此前端没有真实数据源可以切换。
*   **变更记录**:
    *   backend 新增 `GET /api/v1/scholars`，路由位于 `backend/src/routes/scholars.ts`，实现位于 `backend/src/controllers/profile.ts`，返回 `data.scholars` 与 `data.clusters`，只包含 `is_profile_public = true` 的公开 profile。
    *   `backend/src/serializers/profile.ts` 新增 public scholar summary serializer；directory payload 会回传 `primary_msc_code`，供前端卡片与 cluster 逻辑复用。
    *   backend scholar cluster 现按公开 profile 的 primary MSC / 关键词做最小归类，当前覆盖 `Algebraic Geometry`、`Number Theory`、`PDE`、`Topology` 四类，用于 `/scholars` 与 `/portal` teaser 的真实数据展示。
    *   frontend `src/api/profile.ts` 新增 `fetchScholarDirectory()`；`src/features/profile/profileMappers.ts` 新增 scholar summary / cluster transport mapper；`src/features/profile/scholarDirectoryProvider.ts` 在 fake mode 下保持 seed 行为，在 real mode 下改为调用真实 `/scholars` API。
    *   `docs/planning/asiamath-feature-list-v4.0-optimized.json` 已新增并完成 `INT-PROFILE-002`，当前 feature list 口径下所有 feature 均为 `completed`。
*   **验证记录**:
    *   按 TDD 先补失败测试：
        *   `frontend/src/features/profile/scholarDirectoryProvider.test.ts` 在 real mode 下要求 provider 调用真实 API 而不是继续回 seed。
        *   `backend/tests/profile.test.ts` 要求 `GET /api/v1/scholars` 返回公开 scholar 列表与 expertise clusters，并排除 hidden profile。
    *   前端定向测试通过：`npm run test:run --workspace frontend -- src/features/profile/scholarDirectoryProvider.test.ts`
    *   后端定向测试通过：先对 `postgresql://agent:agent@127.0.0.1:5432/asiamath_test?schema=public` 执行 `../node_modules/.bin/prisma migrate reset --force --skip-seed`，再执行 `DATABASE_URL="postgresql://agent:agent@127.0.0.1:5432/asiamath_test?schema=public" ../node_modules/.bin/jest --runInBand tests/profile.test.ts`
    *   前端关联回归通过：`npm run test:run --workspace frontend -- src/features/profile/scholarDirectoryProvider.test.ts src/pages/Scholars.test.tsx src/features/portal/homepageViewModel.test.ts src/pages/Portal.test.tsx`
    *   前端 build 通过：`npm run build --workspace frontend`
    *   real runtime verification 通过：
        *   isolated backend: `PORT=3002 DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public" node -e 'const app=require("./dist/app").default; ...'`
        *   isolated frontend: `VITE_API_BASE_URL="http://127.0.0.1:3002/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5176`
        *   `curl http://127.0.0.1:3002/api/v1/scholars` 实际返回 `Aisha Rahman` / `Ravi Iyer` 及 `Number Theory` / `PDE` clusters，不再是前端 seed。
        *   `agent-browser` 抽查 `http://127.0.0.1:5176/scholars`：可见 `Aisha Rahman`、`Ravi Iyer`、`Number Theory`、`PDE`，console 无错误。
        *   `agent-browser` 抽查 `http://127.0.0.1:5176/portal`：`Scholars & expertise` teaser 同样展示 `Aisha Rahman`、`Ravi Iyer` 与真实 cluster，console 无错误。
*   **边界与说明**:
    *   本轮只解决 public scholar directory / portal scholar teaser 的 real-data 接通，没有改 public scholar detail contract 本身，也没有扩展 profile search / filtering / pagination。
    *   当前 scholar cluster 是基于公开 profile 的 primary MSC / 关键词做最小静态归类，足够支撑当前 `/scholars` 与 `/portal` 展示，但还不是完整 taxonomy 系统。

### 2026-04-28 (Session 44)
*   **Agent 角色**: Coding Agent (`PORTAL` browser-level acceptance close-out)
*   **关联 Feature**: `INT-PORTAL-001` browser evidence close-out only
*   **问题现象**:
    *   Session 43 虽然已经让 `test:portal:int` 在 real backend/frontend 环境下通过，但仍缺浏览器层证据，无法确认 applicant 在真实登录态下的 `/portal`、`/me/applications`、grant detail 是否无报错且正确渲染 released result / post-visit report。
    *   本地 `frontend/vite.config.ts` 的 dev proxy 仍指向 `http://localhost:3000`，而稳定可用的 backend 实例位于 `3001`；如果继续用默认代理做验收，会把 `3000` 根目录启动上下文的已知异常混进 portal 验收结果里。
*   **变更记录**:
    *   `scripts/me-applications-real-flow-check.mjs` 新增 `PORTAL_INT_SKIP_CLEANUP`、`PORTAL_INT_USER_EMAIL`、`PORTAL_INT_USER_PASSWORD` 与 `PORTAL_INT_USER_FULL_NAME` 环境变量支持，并把 applicant 登录凭据回显到脚本 JSON 输出中，方便把 real-flow fixture 复用于浏览器验收。
    *   没有修改 feature list，也没有改 portal 页面代码；本轮目标是给 Session 43 已完成的主链补浏览器证据，而不是新增功能。
*   **验证记录**:
    *   执行通过 `PORTAL_INT_BACKEND_ORIGIN="http://127.0.0.1:3001" PORTAL_INT_FRONTEND_ORIGIN="http://127.0.0.1:5174" DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public" npm run test:portal:int`，确认脚本增强后默认清理路径没有回归。
    *   额外启动一条直连稳定 backend 的 frontend dev server：`VITE_API_BASE_URL="http://127.0.0.1:3001/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5175`。
    *   执行通过 `PORTAL_INT_BACKEND_ORIGIN="http://127.0.0.1:3001" PORTAL_INT_FRONTEND_ORIGIN="http://127.0.0.1:5175" PORTAL_INT_SKIP_CLEANUP="true" PORTAL_INT_USER_EMAIL="portal.int.browser@example.com" PORTAL_INT_USER_PASSWORD="password123" PORTAL_INT_USER_FULL_NAME="Portal Browser Acceptance" DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public" npm run test:portal:int`，保留了一组浏览器可登录的真实 applicant fixture。
    *   使用 `agent-browser` 在 `http://127.0.0.1:5175` 完成 applicant 验收：
        *   登录 `portal.int.browser@example.com / password123` 成功。
        *   `/me/applications` 实际显示 `Integration Grant Conference 2026` 与 `Integration Grant 2026 Travel Support` 两条 released 记录，grant 的 next action 已变成 `View result`。
        *   grant detail `/me/applications/c44d65c9-fce0-45bd-a599-d91855024ffa` 实际渲染 `Awarded`、`Post-visit report`、`Status: submitted`、`Attendance: Confirmed` 与 narrative `Attended the workshop, presented a talk, and met two collaborators.`。
        *   `/portal` 公共入口页在登录态下正常渲染 featured call / opportunities / scholars 等模块，浏览器控制台无错误。
*   **边界与说明**:
    *   `/login` 在没有 `returnTo` state 时默认跳到 `/dashboard` 是当前设计行为，来自 `frontend/src/features/navigation/authReturn.ts` 的 `DEFAULT_AUTH_RETURN_TO = '/dashboard'`；这次验收不把它视为 portal bug。
    *   这轮仍未推进 scholar directory real-data；如果继续补 `PORTAL` 尾项，下一块应该转到 scholar-directory provider 和真实 profile 数据链路。

### 2026-04-28 (Session 43)
*   **Agent 角色**: Coding Agent (`PORTAL` post-visit detail + real-flow integration follow-up)
*   **关联 Feature**: `FE-GRANT-001` / `INT-PORTAL-001` partial close-out
*   **问题现象**:
    *   applicant grant detail 虽然已经能显示 released result，但在 `accepted + reportRequired` 的场景下仍缺 `post-visit report` 提交与已提交展示，导致 dashboard 的 `submit_post_visit_report` next action 没有完整落点。
    *   现有 `scripts/me-applications-real-flow-check.mjs` 只验证 applicant dashboard/detail 的 released decision，不覆盖 post-visit report submit 后的 dashboard/detail 状态切换，因此还不能真正证明 `INT-PORTAL-001` 关掉了这条 grant follow-up 链。
*   **变更记录**:
    *   `frontend/src/api/review.ts`、`frontend/src/features/review/{types,reviewMappers,httpReviewProvider,fakeReviewProvider}.ts` 补齐 applicant detail 的 `postVisitReport` domain 映射和 `submitMyPostVisitReport()` 真实/假 provider 接口。
    *   `frontend/src/pages/MyApplicationDetail.tsx` / `MyApplicationDetail.css` 在 grant detail 中新增 applicant-visible `Submit post-visit report` 表单；提交成功后本地状态切换为 `Post-visit report` 已提交视图，conference detail 则继续不显示该区块。
    *   `frontend/src/features/review/httpReviewProvider.test.ts` 与 `frontend/src/pages/MyApplicationDetail.test.tsx` 先补失败测试，再锁定 real mapper、submit API 调用、grant accepted detail 的表单/已提交双态，以及 conference detail 的隐藏行为。
    *   `scripts/me-applications-real-flow-check.mjs` 现在会在 released grant decision 之后真实调用 `/api/v1/me/applications/:id/post-visit-report`，并断言 dashboard `next_action` 从 `submit_post_visit_report` 收口为 `view_result`，同时确认 grant detail 返回完整 `post_visit_report` payload。
*   **验证记录**:
    *   按 TDD 先扩 `frontend/src/features/review/httpReviewProvider.test.ts` 与 `frontend/src/pages/MyApplicationDetail.test.tsx`，执行 `cd frontend && npm run test:run -- src/features/review/httpReviewProvider.test.ts src/pages/MyApplicationDetail.test.tsx`，确认新增 `postVisitReport` mapper / submit / detail-form 断言先失败。
    *   修复后执行通过同一命令：`2` 个 test files、`10` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/features/review/httpReviewProvider.test.ts`：`3` 个 test files、`24` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`）。
    *   本地 real-flow 验证通过：
        *   用本地 `postgres:16-alpine` 临时容器在 host `5433` 提供 `asiamath_dev`。
        *   frontend dev server 实际监听 `http://127.0.0.1:5174`。
        *   backend 以 `backend/` 目录为 cwd、`PORT=3001` 的 built app 方式稳定提供 API；同样的 app 若从仓库根目录用 ad-hoc wrapper 启在 `3000`，会出现 register/conferences 异常 500，因此这轮 real-flow 以 `3001` 作为可信 backend origin。
        *   执行通过 `PORTAL_INT_BACKEND_ORIGIN="http://127.0.0.1:3001" PORTAL_INT_FRONTEND_ORIGIN="http://127.0.0.1:5174" DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5433/asiamath_dev?schema=public" npm run test:portal:int`，脚本成功验证：real applicant register、conference + linked grant submit、released dashboard/detail、post-visit report submit、submit 后 dashboard/detail 状态切换，以及 unauthenticated dashboard 401。
*   **边界与说明**:
    *   本轮没有做 browser-driven acceptance，因此虽然 `test:portal:int` 已经覆盖了 real backend contract 和 frontend route shell 可达性，但还没有用浏览器实际验证 applicant 在 `/me/applications` / grant detail 上的真实渲染与交互。
    *   本轮没有推进 scholar directory real-data 接通，也没有修改 `docs/planning/asiamath-feature-list-v4.0-optimized.json` 的 feature 状态。
    *   backend `3000` 根目录启动上下文的异常 500 仍值得后续单独收口，但它不再阻塞 `INT-PORTAL-001` 的真实链路验证，因为 `3001` 的同代码实例已证明 contract 本身可用。

### 2026-04-28 (Session 42)
*   **Agent 角色**: Coding Agent (Conference apply UX hint follow-up)
*   **关联 Feature**: `CONF` applicant apply flow partial follow-up only
*   **问题现象**:
    *   conference apply 表单里，`Submit application` 在未满足条件时会直接禁用，但用户看不到哪些字段必填，也不知道当前是“还没先保存 draft”还是“talk submission 还缺 abstract”。
*   **变更记录**:
    *   `frontend/src/features/conference/ConferenceApplyForm.tsx` 为 `Participation type`、`Statement` 增加可见必填标记，并为 `Abstract title`、`Abstract text` 增加 `required for talk` 标签说明。
    *   submit 区域现在会在按钮禁用时显示单行条件提示，至少覆盖 `Save this draft once before submitting`、缺 `Participation type`、缺 `Statement`、以及 `talk` submission 缺 abstract title / text 这几类状态。
    *   `frontend/src/pages/ConferenceApply.test.tsx` 先补失败测试，再锁定新标签与 submit hint 行为；同时把原有 portal-origin return-path 断言从单个 `View details` 收紧为首个匹配项，避免测试因列表里存在多个 conference card 而误报。
    *   `frontend/src/pages/Conference.css` 增加必填标记、条件标签和 submit hint 的最小样式，不改整体 page layout。
*   **验证记录**:
    *   按 TDD 先修改 `frontend/src/pages/ConferenceApply.test.tsx`，执行 `cd frontend && npm run test:run -- src/pages/ConferenceApply.test.tsx`，确认新增 required-marker / submit-hint 断言先失败。
    *   修复后执行通过同一命令：`1` 个 test file、`9` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`）。
*   **边界与说明**:
    *   本轮没有改 submit 流程本身，仍保持“先 save draft，再 submit”的现有实现；只补可见提示，降低用户猜测成本。
    *   本轮没有扩展 organizer / reviewer 相关表单，也没有改 backend conference application contract。

### 2026-04-28 (Session 41)
*   **Agent 角色**: Coding Agent (Applicant summary parity fix)
*   **关联 Feature**: `FE-PORTAL-001` partial follow-up only
*   **问题现象**:
    *   applicant 提交 conference application 后，在 `/me/applications/:id` 的 `Application summary` 中只能看到 `Statement`，看不到已填写的 `Participation type`、`Abstract title`、`Abstract text` 和 `Interested in travel support`。
    *   同一条 application 在 reviewer / organizer 视图中已经能看到 abstract 相关字段，因此 applicant detail 明显比其它角色视图缺字段。
*   **根因定位**:
    *   applicant detail contract 单独走 `serializeApplicantApplicationDetail()` / `ApplicantApplicationDetail`，这条链路没有序列化或映射 `participation_type`、`abstract_title`、`abstract_text`、`interested_in_travel_support`。
    *   同时 `frontend/src/pages/MyApplicationDetail.tsx` 的 `Application summary` 区块只渲染了 `statement`、grant-specific summary 字段、extra answers 和 files，即使这些 conference fields 存在也不会显示。
*   **变更记录**:
    *   `backend/src/serializers/workflow.ts` 为 applicant detail payload 补回 `participation_type`、`abstract_title`、`abstract_text`、`interested_in_travel_support`。
    *   `frontend/src/features/review/types.ts`、`reviewMappers.ts`、`fakeReviewProvider.ts` 对齐 applicant detail contract，确保 real/fake provider 都携带这些字段。
    *   `frontend/src/pages/MyApplicationDetail.tsx` 的 `Application summary` 现在会显示 participation type、abstract title、abstract text，以及 conference application 的 travel support 状态。
    *   `frontend/src/pages/MyApplicationDetail.test.tsx` 与 `frontend/src/features/review/httpReviewProvider.test.ts` 补回归，锁定 applicant detail summary 和 real API mapper 不再漏字段。
    *   `backend/tests/review.test.ts` 扩展 applicant detail API 断言，要求 `/api/v1/me/applications/:id` 返回这些 conference-specific fields。
*   **验证记录**:
    *   按 TDD 先补失败测试，执行 `cd frontend && npm run test:run -- src/pages/MyApplicationDetail.test.tsx src/features/review/httpReviewProvider.test.ts`，确认 applicant detail mapper / summary 断言先失败。
    *   修复后执行通过同一命令：`2` 个 test files、`7` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`）。
    *   backend full DB integration test 这轮未完成：当前 worktree 未配置 `TEST_DATABASE_URL`，而 `cd backend && npx tsc --noEmit` 还会命中 postgres 分支已有的 Prisma typing / implicit any 历史问题，无法把 serializer 改动单独跑成一轮 clean backend green。
*   **边界与说明**:
    *   本轮只修 applicant detail summary 的字段缺失，没有改 reviewer / organizer detail grammar，也没有改 submit flow 本身。
    *   backend serializer 已随代码补齐，但仍需要在有 `TEST_DATABASE_URL` 的 postgres 环境里补跑一次 `review.test.ts`，确认真实 `/api/v1/me/applications/:id` 集成返回与前端当前展示一致。

### 2026-04-28 (Session 40)
*   **Agent 角色**: Coding Agent (Role workspace fix)
*   **关联 Feature**: `FE-PORTAL-001` partial follow-up only
*   **问题现象**:
    *   使用 reviewer / organizer 账号登录后，前端仍统一落到 applicant-only `/dashboard` 内容。
    *   `Dashboard` 会无差别请求 applicant `My Applications` 数据，并渲染 applicant badge、入口与 walkthrough 文案，导致 reviewer / organizer 看不到属于自己角色的工作台内容。
*   **变更记录**:
    *   `frontend/src/pages/Dashboard.tsx` 改为按 `getMe()` 返回的 `role` / `primary_role` 分流：reviewer / organizer / admin 不再走 applicant application aggregation，而是进入各自角色的 workspace landing。
    *   reviewer 登录后，`/dashboard` 现在呈现 reviewer badge、review queue 主入口，以及 reviewer scope 说明，不再显示 applicant application widget。
    *   organizer 登录后，`/dashboard` 现在呈现 organizer badge、conference workspace 主入口；若账号存在 `conference_staff_memberships`，主入口会直接落到对应 conference application queue，否则回落到 `Create organizer conference`。
    *   dashboard account menu 现在同样按角色收口：applicant 保持 `My Applications` / `My Profile`，reviewer 指向 `Reviewer Queue`，organizer 指向 `Conference Workspace`，避免登录后菜单仍暴露 applicant-only 主入口。
    *   `frontend/src/pages/Dashboard.test.tsx` 新增 reviewer / organizer 两条回归，锁定“非 applicant 不再拉 applicant dashboard 数据”和“dashboard 内容随角色切换”这两个行为。
*   **验证记录**:
    *   preflight：新 worktree 创建后执行 `npm run test:smoke`；其中前端 baseline 通过，backend baseline 在 Prisma migrate 阶段触发已有的 `Schema engine error`，确认这是当前 `demo/d0` 基线问题，不是本轮 role workspace 改动引入。
    *   按 TDD 先修改 `frontend/src/pages/Dashboard.test.tsx`，执行 `cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx`，确认 reviewer / organizer 断言先失败。
    *   修复后执行通过 `cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx`：`1` 个 test file、`7` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/Login.test.tsx src/pages/Dashboard.test.tsx`：`2` 个 test files、`10` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮只修 authenticated dashboard 的角色分流，没有新增 organizer root route，也没有改 reviewer queue / organizer queue 详情页本身。
    *   `FE-PORTAL-001` 仍是更大的 portal + applicant dashboard feature，本轮只是收口其中一个实际 demo 缺口，因此没有把 feature list 直接标记为 `completed`。

### 2026-04-27 (PostgreSQL deployment slice)
*   **Agent 角色**: Coding Agent (Deployment and database migration)
*   **完成 Slice**: `demo/d0` PostgreSQL baseline + Vercel/Railway split deployment preview
*   **变更记录**:
    *   Prisma datasource 改为 PostgreSQL，并重建 active migration 历史。
    *   backend `start` / `dev` / `test` 改为环境变量驱动，不再依赖 SQLite 文件库。
    *   seed / integration 脚本移除 SQLite fallback，改为显式要求 `DATABASE_URL`。
    *   frontend API client 改为 `VITE_API_BASE_URL` 可配置，Vercel 增加 SPA rewrite 配置。
*   **验证记录**:
    *   backend Jest suite 通过 PostgreSQL test database 运行。
    *   `npm run test:portal:int` 与 `npm run test:grant:int` 在 PostgreSQL development database 上通过。
    *   Railway backend preview 可启动并执行 `prisma migrate deploy`。
    *   Vercel frontend preview 可通过配置的 Railway API origin 访问真实后端。
*   **边界与说明**:
    *   本轮未迁移旧 SQLite 数据。
    *   backend 生产运行时暂时保留 `ts-node`，后续再切换到 `tsc + node dist`。

### 2026-04-27 (Session 39)
*   **Agent 角色**: Coding Agent (Applicant workspace bugfix)
*   **完成 Feature**: `PORTAL` local applicant workspace schema-drift repair
*   **问题现象**:
    *   在 real backend + real-aligned frontend 下，applicant 提交 conference application 后回到 `/me/applications`，页面会落到 `My applications unavailable` error state。
*   **根因定位**:
    *   通过 `npm run test:portal:int` 复现后确认，真实失败点不是前端 return flow，而是 backend `GET /api/v1/me/applications` 返回 `500`.
    *   进一步排查发现 `listMyApplications()` 新 include 的 `postVisitReport` relation 依赖 `PostVisitReport` 表；本地 `dev.db` 在某些开发机会话中没有应用 `20260426021200_add_post_visit_report_model` migration，于是 Prisma 在读 applicant dashboard 时直接报表不存在。
    *   这属于 local dev database schema drift，不是 submit payload 或 MyApplications page 自身的展示逻辑错误。
*   **变更记录**:
    *   `backend/package.json` 的 `start` / `dev` 脚本现在都会先执行 `prisma migrate deploy`，确保本地 backend 在启动前把 `dev.db` 迁到当前 schema，而不是继续带着旧 SQLite 结构提供 API。
    *   `backend/tests/databaseConfig.test.ts` 补了配置级约束，锁定 backend `dev` / `start` 必须先跑 migration，防止以后再次出现“新 relation 已入代码、旧 dev.db 未迁移”的同类回归。
*   **验证记录**:
    *   按 TDD 先补失败测试，再执行 `cd backend && npm test -- --runInBand tests/databaseConfig.test.ts`，确认新增约束在旧脚本配置下先失败。
    *   修复脚本后再次执行 `cd backend && npm test -- --runInBand tests/databaseConfig.test.ts`，`3` 个 tests 全部通过。
    *   对当前 local `dev.db` 手动执行一次 `cd backend && DATABASE_URL=file:./dev.db ./node_modules/.bin/prisma migrate deploy`，确认 `20260426021200_add_post_visit_report_model` 已成功应用。
    *   复跑真实 applicant integration：`npm run test:portal:int`，conference submit -> grant submit -> `/api/v1/me/applications` -> detail reads 全链路通过，不再返回 `500`。
*   **边界与说明**:
    *   本轮没有改 conference apply / MyApplications 的产品逻辑，也没有扩展 review / dashboard data contract；修的是 local backend boot discipline，避免 dev schema drift 把 applicant workspace 打挂。

### 2026-04-27 (Session 38)
*   **Agent 角色**: Coding Agent (Public page visual unification Phase 2)
*   **完成 Feature**: `PORTAL` public browse visual unification, Phase 2 only
*   **计划微调**:
    *   当前 `demo/d0` 已包含 Phase 1 结果与共享 `public-browse.css` 基座，因此本轮没有回头重做 implementation plan 的 Phase 1 任务。
    *   本轮按 plan 保留了 preflight、Phase 2 contract tests、Phase 2 regression、full public-page regression、build 与 browser acceptance；Phase 1 页面只作为回归集参与验证。
*   **变更记录**:
    *   扩展 `frontend/src/styles/public-browse.css`，为 Phase 2 页面补齐共享 `public-browse-list`，并收紧 public card 内普通文本链接与 primary CTA 的分工，避免 detail-aside primary links 被 list-link grammar 覆盖。
    *   `frontend/src/pages/Newsletters.tsx`、`NewsletterDetail.tsx`、`Publications.tsx`、`PublicationDetail.tsx`、`Videos.tsx`、`VideoDetail.tsx`、`Partners.tsx`、`Governance.tsx`、`Outreach.tsx` 全部接入既有 shared public-browse hooks：`public-browse-page`、`public-browse-grid`、`public-browse-card`、`public-browse-meta`、`public-browse-copy`、`public-browse-actions`、`public-browse-aside-card`，并把 detail-aside CTA 收口到共享 `public-browse-primary-link`。
    *   `frontend/src/pages/Newsletter.css`、`Publication.css`、`Video.css`、`Partner.css`、`Governance.css`、`Outreach.css` 删除旧的 fallback-token card/grid 重复规则，只保留 route-specific 结构，例如 highlight list、matching teaser 与 teaser-card 对齐。
    *   `frontend/src/pages/Newsletters.test.tsx`、`Partners.test.tsx`、`Governance.test.tsx`、`Outreach.test.tsx` 补强 Phase 2 contract tests，锁定 shared masthead、archive/detail CTA、meta 文案与 governance/outreach/partner teaser 内容。
*   **验证记录**:
    *   preflight baseline 通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/Prizes.test.tsx src/pages/Newsletters.test.tsx src/pages/Publications.test.tsx src/pages/Videos.test.tsx src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`11` 个 test files、`43` 个 tests 全部通过。
    *   preflight build 通过：`cd frontend && npm run build`。
    *   Phase 2 contract tests 通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Prizes.test.tsx src/pages/Newsletters.test.tsx src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`6` 个 test files、`19` 个 tests 全部通过。
    *   Phase 2 regression 通过：`cd frontend && npm run test:run -- src/pages/Newsletters.test.tsx src/pages/Publications.test.tsx src/pages/Videos.test.tsx src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`6` 个 test files、`19` 个 tests 全部通过。
    *   最终 full public-page regression 通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/Prizes.test.tsx src/pages/Newsletters.test.tsx src/pages/Publications.test.tsx src/pages/Videos.test.tsx src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`11` 个 test files、`43` 个 tests 全部通过。
    *   最终 build 通过：`cd frontend && npm run build`（`tsc -b && vite build`）。
    *   browser acceptance 通过：本地 Vite dev server 在 `http://127.0.0.1:4176` 下抽查了 `/portal` 基准页，以及 `/newsletter`、`/publications`、`/videos`、`/partners`、`/admin/governance`、`/outreach`，并补看 detail surfaces `/newsletter/asiamath-monthly-briefing-april-2026`、`/publications/asiamath-school-notes-preview`、`/videos/asiamath-research-school-session-recap`；shared public masthead、page-title rhythm、card/meta/aside grammar 均可见，secondary public pages 明显比 `/portal` 更克制，且所有抽查页面均无 browser page errors。
*   **边界与说明**:
    *   本轮严格只完成 Phase 2：newsletter、publications、videos、partners、governance、outreach，以及支撑它们的 shared public-browse style layer / tests / progress log。
    *   没有回头修改 Phase 1 页面实现，没有改 `WorkspaceShell`、apply flows、`/me/*`、reviewer / organizer / admin workflow、login / register，也没有扩散到 stale applicant session 修复之外的无关分支工作。

### 2026-04-27 (Session 37)
*   **Agent 角色**: Coding Agent (UX follow-up note)
*   **记录问题**: applicant workspace 缺少自然的 `back to portal` affordance
*   **问题说明**:
    *   当前从 `Account` 下拉进入 `My Applications` 或 `My Profile` 后，用户缺少稳定、自然、始终可见的返回 `Portal` 入口。
    *   `Dashboard` 中现有的 `Restart from portal` 更像 demo walkthrough affordance，而不是产品级的全局导航能力，因此不能视为该问题已被解决。
*   **设计判断**:
    *   这个问题应视为 workspace-shell 级别的 IA / navigation gap，而不是 `Account` 菜单本身的问题。
    *   更合理的修正方向是在 applicant workspace 顶层 shell 中提供公共浏览面的稳定出口，例如可感知的 `Portal` / `Browse opportunities` 入口，或让品牌位承担明确的 public-home return 语义。
    *   不建议把 `Portal` 塞进 `Account` 下拉里，因为它属于主导航回流，不属于账户动作。
*   **下一步**: 在继续 `public page visual unification` 之前，先为 applicant workspace 补一个简短 spec / implementation delta，明确 `portal return affordance` 应该落在 `WorkspaceShell` 而不是 dashboard-only CTA。

### 2026-04-27 (Session 36)
*   **Agent 角色**: Coding Agent (Public page visual unification Phase 1)
*   **完成 Feature**: `PORTAL` public browse visual unification, Phase 1 only
*   **变更记录**:
    *   新增 `frontend/src/styles/public-browse.css`，抽出 Phase 1 public browse 共享语法层，统一 visitor-facing 主链路页面的 body style language：page body rhythm、list/detail card padding、meta row、CTA row、aside card 以及 public action link treatment。
    *   `frontend/src/index.css` 接入新的 shared layer；`frontend/src/styles/layout.css` 收紧 `PortalShell` 的 public header rhythm；`frontend/src/styles/components.css` 把 `school` / `prize` primary link 拉到与 `conference-primary-link` 同一 CTA grammar。
    *   `frontend/src/pages/Conferences.tsx`、`ConferenceDetail.tsx`、`Grants.tsx`、`GrantDetail.tsx`、`Schools.tsx`、`SchoolDetail.tsx`、`Prizes.tsx`、`PrizeDetail.tsx`、`Scholars.tsx`、`ScholarProfile.tsx` 以及对应 list/detail 展示组件补上 shared public-browse class hooks，让 Phase 1 主链路公共页都走同一套 shared public-browse primitives，而不迁移到 `WorkspaceShell`。
    *   `frontend/src/pages/Conference.css` 仅对 public-browse-in-scope 元素让位给 shared layer，保留非本次范围的 conference/grant apply、editor、review 等页面继续走原规则；`School.css`、`Prize.css`、`Scholars.css`、`Profile.css` 删除或收窄只属于 public browse 的重复规则，保留 route-specific 内容结构。
    *   `frontend/src/pages/Conferences.test.tsx`、`Grants.test.tsx`、`Prizes.test.tsx` 先补 contract tests，再实现样式统一，锁定 public masthead、标题、元信息、CTA 以及 prize hub/detail teaser 链路。
*   **验证记录**:
    *   preflight baseline 通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/Prizes.test.tsx src/pages/Newsletters.test.tsx src/pages/Publications.test.tsx src/pages/Videos.test.tsx src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`11` 个 test files、`40` 个 tests 全部通过。
    *   preflight build 通过：`cd frontend && npm run build`。
    *   新增 contract tests 后执行通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Prizes.test.tsx`，`3` 个 test files、`19` 个 tests 全部通过。
    *   Phase 1 regression 通过：`cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/Prizes.test.tsx src/pages/ConferenceDetail.test.tsx src/pages/ScholarProfile.test.tsx`，`7` 个 test files、`29` 个 tests 全部通过。
    *   最终 build 通过：`cd frontend && npm run build`（`tsc -b && vite build`）。
    *   browser acceptance 通过：本地 Vite dev server 在 `http://127.0.0.1:4176` 下成功加载 `/conferences`、`/grants`、`/schools`、`/scholars`、`/prizes`，并抽查了 detail surfaces：`/conferences/asiamath-2026-shanghai`、`/grants/integration-grant-2026-travel-support`、`/schools/algebraic-geometry-research-school-2026`、`/prizes/asiamath-early-career-prize-2026`；shared masthead、title rhythm、card/aside hierarchy 均可见，控制台无 runtime errors。`/scholars/prof-reviewer` 在当前 dev data 下呈现 unavailable state，但 header / empty-state surface 正常，且无 console errors。
*   **边界与说明**:
    *   本轮严格只做 Phase 1：`/conferences`、`/conferences/:slug`、`/grants`、`/grants/:slug`、`/schools`、`/schools/:slug`、`/scholars`、`/scholars/:slug`、`/prizes`、`/prizes/:slug`。
    *   没有进入 Phase 2；`newsletter / publications / videos / partners / governance / outreach` 的 public breadth surfaces 未在本轮修改。
    *   没有改 `WorkspaceShell`、apply flows、`/me/*`、reviewer / organizer / admin workflow、login / register，也没有触碰 account-menu 那批无关工作。
    *   homepage dark hero 仍只属于 `/portal`；本轮统一的是 secondary public pages 的 body language，而不是把二级 public pages 改成第二个 homepage hero。
*   **下一步**: 如需继续 public browse 统一，下一轮可按既有 spec/plan 做 Phase 2，把 newsletter / publications / videos / partners / outreach / governance 拉到同一 shared public-browse grammar。

### 2026-04-27 (Session 35)
*   **Agent 角色**: Coding Agent (Account menu / auth return baseline repair)
*   **完成 Feature**: `PORTAL` account-menu + auth-return-flow baseline repair
*   **变更记录**:
    *   `frontend/src/features/navigation/accountMenu.ts` 与 `authReturn.ts` 新增共享 applicant account IA 与 `returnTo` helper；`WorkspaceShell.tsx` 正式接入可选 `accountMenu` 契约，修复 clean worktree 因 `Shell.test.tsx` 先于实现落地而导致的 build baseline 断裂。
    *   `frontend/src/components/layout/PublicPortalNav.tsx` 改为消费共享 applicant account menu；public-shell `Log out` 现在会清 token 并停留在当前 public route，而不是强制跳回 `/portal`。`Login.tsx` / `Register.tsx` 同时改为通过共享 helper 读取和透传 `returnTo`。
    *   `frontend/src/features/navigation/workspaceAccountMenu.ts` 作为薄适配层接入 shared applicant account IA，并把 `Account` 菜单 rollout 到 applicant-owned workspace surfaces：`Dashboard`、`MyApplications`、`MyApplicationDetail`、`MeProfile`、signed-in `ConferenceApply`、signed-in `GrantApply`。
    *   applicant protected-route / auth-entry 行为收口：`Dashboard`、`MyApplications`、`MyApplicationDetail`、`MeProfile` 现在在未登录时会带 `returnTo` 跳到 `Login`；signed-out `ConferenceApply` / `GrantApply` 的 `Go to login` CTA 也会保留原目标页。
    *   移除了 dashboard-local logout affordance 和残留 `.logout-btn` 样式；同时补强 `WorkspaceShell` account menu 的可访问性语义与 dismiss 行为（`aria-haspopup="menu"`、Escape dismiss、outside-click dismiss），并把静态 applicant link 列表收口成不可变定义。
    *   新增或扩展测试：`Login.test.tsx`、`Register.test.tsx`、`Dashboard.test.tsx`、`MyApplications.test.tsx`、`MyApplicationDetail.test.tsx`、`ConferenceApply.test.tsx`、`GrantApply.test.tsx`，锁定 public-origin auth return、workspace logout、protected-route `returnTo`、以及 signed-in applicant account menu 可见性。
*   **验证记录**:
    *   clean worktree preflight 先复现旧基线问题：`cd frontend && npm run build` 因 `Shell.test.tsx` 中的 `accountMenu` 契约与 committed `WorkspaceShell` 实现不一致而失败。
    *   Unit A focused verification 通过：`cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/components/layout/PublicPortalNav.test.tsx src/pages/Login.test.tsx src/pages/Register.test.tsx`，`4` 个 test files、`12` 个 tests 全部通过；随后 `cd frontend && npm run build` 通过。
    *   Unit B focused verification 通过：`cd frontend && npm run test:run -- src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx`，`5` 个 test files、`36` 个 tests 全部通过；随后 `cd frontend && npm run build` 通过。
    *   最终整组 targeted regression 通过：`cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/components/layout/PublicPortalNav.test.tsx src/pages/Login.test.tsx src/pages/Register.test.tsx src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx`，`9` 个 test files、`48` 个 tests 全部通过。
    *   最终 `cd frontend && npm run build`（`tsc -b && vite build`）通过，无类型或构建错误。
    *   browser-level acceptance 通过：
        *   signed-in `/schools` 可见 `Account`，点击 `Log out` 后仍停留在 `/schools`，且 `Sign in` 恢复可见，`localStorage.token` 被清空。
        *   signed-in `/me/applications` 可见 `Account`；点击 `Log out` 后回到 `/portal`，且 `localStorage.token` 被清空。
        *   上述浏览器交互后 `agent-browser` console errors 为空。
    *   final verification 过程中发现 `Register.test.tsx` 在大批量 suite 下存在时序性假红；根因是成功跳转断言使用同步 `getByText`。已在 `Login.test.tsx` / `Register.test.tsx` 中改成 `findByText`，复跑整组 regression 后稳定通过。
*   **边界与说明**:
    *   本轮只修 account-menu / auth-return-flow 基线，不涉及 public-page visual unification、homepage palette、或 reviewer / organizer / admin account menu。
    *   `MeProfile` 的 protected-route 行为已收口，但本轮没有新增单独的 `MeProfile.test.tsx`；相关 deterministic redirect 主要通过代码审查与 scoped route behavior 一致性确认。
    *   browser acceptance 对 auth return 的“成功后回原页”更多依赖 Vitest，因为本地浏览器验收环境没有稳定的 live auth backend 参与整条登录成功链路。
*   **下一步**: 在此基线已恢复后，重新回到 `docs/superpowers/plans/2026-04-27-public-page-visual-unification-implementation.md` 的 `Phase 1`，用新的 clean worktree 执行 public browse surfaces 的 body-style unification，而不再被 `WorkspaceShell/accountMenu` 的 preflight blocker 卡住。

### 2026-04-27 (Session 34)
*   **Agent 角色**: Coding Agent (Homepage UI priority pass)
*   **完成 Feature**: `PORTAL` homepage readability / hierarchy refinement
*   **变更记录**:
    *   `frontend/src/pages/Portal.tsx` / `Portal.css` 依照 2026-04-27 UI priority addendum 收口首页 hero：移除了 hero 右侧重复的 featured opportunity card，把右侧 panel 收回到纯 summary / orientation 角色，避免与主标题和下方 `Featured opportunities` 区块竞争。
    *   `frontend/src/styles/tokens.css` 新增 dark-surface text tokens，并重新校准 public-facing `navy / stone / accent` 基础色值，让 hero 和浅色 surface 的对比关系更明确。
    *   `frontend/src/pages/Portal.css` 提升了 hero headline、lede、stats、summary panel 的可读性，减弱了 grid / glow 的噪音，并统一了 hero CTA 与下方卡片的圆角和 surface grammar。
    *   `frontend/src/components/layout/PublicPortalNav.css` 做轻量减重：降低 topbar prominence，收紧 nav height 与 link padding，减轻 `Sign in` 的视觉体量，但不改动 nav IA。
    *   `frontend/src/pages/Portal.test.tsx` 新增失败后转绿的约束，锁定“featured opportunity 链接只应出现在 featured section，而不应在 hero 内重复”。
*   **验证记录**:
    *   按 TDD 先补 `src/pages/Portal.test.tsx` 的失败用例，再执行通过 `cd frontend && npm run test:run -- src/pages/Portal.test.tsx`。
    *   执行通过 `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/pages/Schools.test.tsx src/pages/ConferenceDetail.test.tsx`，`3` 个 test files、`8` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
    *   浏览器验收通过：本地 `vite` dev server 在 `http://127.0.0.1:4173` 下可正常打开 `/portal` 与 `/schools`；`/portal` hero 内已不再出现重复 featured link，`/schools` 仍保留统一 public masthead，控制台无 runtime errors。
*   **边界与说明**:
    *   本轮只处理 UI 优先级最高的问题：可读性、hero hierarchy、palette 收敛、masthead 减重。
    *   没有重做 section order，没有扩展新模块，也没有把 application flows 或 authenticated shell 拉进同一轮视觉重构。
    *   颜色方向仍可能继续微调；这轮的目标是先从“读不清、抢焦点、风格不收口”退回到更稳定的 public homepage。
*   **下一步**: 如果继续深化，建议先做一轮纯视觉 polish：更细的 palette tuning、hero / section vertical rhythm、以及 `Featured opportunities` 与 `Schools` 卡片在 typography 上的进一步统一。

### 2026-04-27 (Session 33)
*   **Agent 角色**: Coding Agent (Public shell consistency follow-up)
*   **完成 Feature**: `PORTAL` public masthead rollout across visitor-facing pages
*   **变更记录**:
    *   将统一的 `PublicPortalNav` masthead 从 `/portal` / `/scholars` 扩展到 homepage nav 直接可达的 public pages 与其 detail pages：`Conferences`、`ConferenceDetail`、`Grants`、`GrantDetail`、`Schools`、`SchoolDetail`、`Prizes`、`PrizeDetail`、`ScholarProfile`、`Newsletters` / `NewsletterDetail`、`Publications` / `PublicationDetail`、`Videos` / `VideoDetail`。
    *   继续把同一套 public shell 接到 public preview surfaces：`Partners`、`Governance`、`Outreach`，避免从 public detail teaser 深入后又掉回旧壳。
    *   为 `Schools`、`ConferenceDetail`、`Partners`、`Governance`、`Outreach` 补充测试断言，锁定 “visitor-facing 页面必须保留 `Public sections` 导航” 这一约束。
*   **验证记录**:
    *   按 TDD 先让 `src/pages/Schools.test.tsx` 与 `src/pages/ConferenceDetail.test.tsx` 因缺少 public masthead 而失败，再完成实现。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/Schools.test.tsx src/pages/ConferenceDetail.test.tsx src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Prizes.test.tsx src/pages/ScholarProfile.test.tsx`，`6` 个 test files、`24` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/Newsletters.test.tsx src/pages/Publications.test.tsx src/pages/Videos.test.tsx`，`3` 个 test files、`14` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/Partners.test.tsx src/pages/Governance.test.tsx src/pages/Outreach.test.tsx`，`3` 个 test files、`5` 个 tests 全部通过。
    *   浏览器抽查通过：本地 `vite` dev server 在 `http://127.0.0.1:4173` 正常提供 `/portal` 与 `/schools`，`/schools` 页面可见新的 `Public sections` masthead，控制台无 runtime errors。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮没有改色板，只推进 public shell 一致性；首页当前 palette 仍待后续单独调校。
    *   `ConferenceApply` / `GrantApply` 仍保留 `WorkspaceShell`，因为它们已经进入 applicant-flow 语义，而不是纯 visitor-facing browse surface。
    *   工作区中 account-menu 相关未提交改动继续保持未触碰。
*   **下一步**: 如果继续深化 public 体验，优先做两件事：1) 重新校准 homepage / masthead 的色彩与对比度；2) 决定是否把 `WorkspaceShell` 的申请页也拉到更接近 public shell 的视觉语言，还是明确维持“浏览页 / 申请页”两套层级。

### 2026-04-26 (Session 32)
*   **Agent 角色**: Coding Agent (Homepage fidelity / public navigation follow-up)
*   **完成 Feature**: `PORTAL` homepage fidelity pass + public return-context repair
*   **变更记录**:
    *   `frontend/src/components/layout/PublicPortalNav.tsx` / `PublicPortalNav.css` 重做 public masthead：加入 slim topbar、editorial-style nav shell、brand mark、参考稿风格的 topbar links，同时保留 resources dropdown 与 account / sign-in 分支。
    *   `frontend/src/pages/Portal.tsx` / `Portal.css` 把 `/portal` 从“结构已对齐”的版本推进到更接近 `asiamath-home-fixed.html` 的高保真实现：深色 hero、grid/glow 背景、`Network at a glance` hero panel、hero stat strip、以及更接近参考稿的 section typography / pacing / card treatment。
    *   `frontend/src/styles/tokens.css` 切换到更接近参考稿的 public typography 与 palette：`EB Garamond + DM Sans + DM Mono`，并把 accent / canvas / panel 色值向参考 HTML 收拢。
    *   修复 public portal 返回链：`PublicPortalNav` 现在会在 portal-origin 或已有 return context 存在时把 state 继续传递到 public pages；`Scholars` / `ScholarSummaryCard` 与 `Schools` / `SchoolDetail` 也补齐了 list → detail → parent → portal 的 chained return-state 传播，不再从首页导航点进去后失去返回入口。
*   **验证记录**:
    *   改动前执行通过 `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/pages/Portal.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/ScholarProfile.test.tsx`。
    *   改动前执行通过 `cd frontend && npm run build`（`tsc -b && vite build`）。
    *   按 TDD 先补 portal return-context 失败测试，再执行通过 `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/pages/Scholars.test.tsx src/pages/Schools.test.tsx`。
    *   按 TDD 补 homepage fidelity 结构测试，再执行通过 `cd frontend && npm run test:run -- src/pages/Portal.test.tsx`。
    *   执行通过 focused regression：`cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/pages/Portal.test.tsx src/pages/Schools.test.tsx src/pages/Scholars.test.tsx src/pages/ScholarProfile.test.tsx`，`5` 个 test files、`16` 个 tests 全部通过。
    *   执行通过 public-breadth regression：`cd frontend && npm run test:run -- src/pages/ConferenceDetail.test.tsx src/pages/Prizes.test.tsx src/pages/Partners.test.tsx`，`3` 个 test files、`5` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮没有扩展 backend，没有新增 real scholar search/filtering，也没有改 authenticated dashboard 或 account-menu in-progress 分支。
    *   高保真目标是“视觉上明显接近参考 HTML”，不是直接拷贝静态 DOM；当前 React 数据结构、homepage section order、`M4` 位置与 hybrid provider 方案保持不变。
    *   还没有做 browser-level acceptance，也没有逐页对 conference / grants / schools / scholars 的列表/detail 进行统一视觉重构；本轮只修它们的 portal return chain。
*   **下一步**: 做 browser-level acceptance，重点检查 `/portal` hero / masthead 的实际呈现、`/portal -> /schools -> /schools/:slug -> back` 等公共链路，以及移动端 nav 收起后的可用性；若继续深化，再决定是否把 conference / grants / scholars page 自身也拉到与首页更一致的视觉语言。

### 2026-04-26 (Session 31)
*   **Agent 角色**: Coding Agent (Public portal / M4 breadth slice)
*   **完成 Feature**: `PORTAL` homepage rebuild + `M4` public-directory demo slice
*   **变更记录**:
    *   `frontend/src/components/layout/PublicPortalNav.tsx` 新增 `Scholars` 公共导航入口，并以现有 React 架构补齐 `frontend/src/pages/Scholars.tsx` / `Scholars.css` / `Scholars.test.tsx`，让 `M4` 从单个 profile detail 扩展成可浏览的公共目录页。
    *   `frontend/src/features/profile/` 新增 hybrid scholar directory 层：扩展 list-level public scholar / expertise cluster types，加入 `directorySeed.ts` 与 `scholarDirectoryProvider.ts`，并复用 editable public profile，让 `alice-chen-demo` 能在 public visibility 打开时稳定出现在目录与首页 teaser 里。
    *   `frontend/src/features/portal/homepageViewModel.ts` 与 `frontend/src/pages/Portal.tsx` / `Portal.css` 重建 `/portal` 首页结构：hero 后依次呈现 featured opportunities、school spotlights、`Scholars & expertise` mixed teaser，并保留 `Browse Scholar Directory` 入口，符合 2026-04-26 版 homepage + M4 design spec。
    *   `frontend/src/pages/ConferenceDetail.tsx` 新增 `Related scholar context` 侧栏卡片，把 conference public detail 显式连到 `/scholars/alice-chen-demo`；`frontend/src/pages/Prizes.tsx` 改成 hub + archive 结构，`frontend/src/pages/PrizeDetail.tsx` 把 scholar CTA 明确成 `View sample laureate profile`，让 `M4` 在 `M2` / `M6` demo surface 中可见复用。
*   **验证记录**:
    *   改动前执行通过 `cd frontend && npm run test:run -- src/pages/Portal.test.tsx src/pages/Prizes.test.tsx src/pages/ScholarProfile.test.tsx src/pages/Partners.test.tsx`。
    *   执行通过 targeted tests：
        *   `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx`
        *   `cd frontend && npm run test:run -- src/features/profile/scholarDirectoryProvider.test.ts`
        *   `cd frontend && npm run test:run -- src/components/layout/Shell.test.tsx src/pages/Scholars.test.tsx`
        *   `cd frontend && npm run test:run -- src/features/portal/homepageViewModel.test.ts src/pages/Portal.test.tsx`
        *   `cd frontend && npm run test:run -- src/pages/ConferenceDetail.test.tsx src/pages/Prizes.test.tsx`
    *   执行通过 `cd frontend && npm run test:run -- src/components/layout/PublicPortalNav.test.tsx src/features/profile/scholarDirectoryProvider.test.ts src/pages/Scholars.test.tsx src/features/portal/homepageViewModel.test.ts src/pages/Portal.test.tsx src/pages/ConferenceDetail.test.tsx src/pages/Prizes.test.tsx src/pages/ScholarProfile.test.tsx src/pages/Partners.test.tsx`：`9` 个 test files、`19` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮没有新增任何 backend endpoint；`/scholars` 仍是 hybrid/demo data slice，由 seeded public scholars 加上当前 editable public profile 组成。
    *   本轮只扩展 public breadth surfaces，没有把 scholar search、real filtering、institution browse、review-only scholar context、或新的 dashboard flow 一并拉进来。
    *   工作区里其他与 account menu / auth shell 相关的本地修改继续保持未触碰、未提交。
*   **下一步**: 做一轮 browser-level acceptance，确认 `/portal`、`/scholars`、conference detail、prize hub 的实际视觉与 click path 符合 demo narration；如果继续深化 `M4`，优先考虑 real scholar list contract 或更多 school / prize / partner 的 scholar-context reuse。

### 2026-04-26 (Session 30)
*   **Agent 角色**: Coding Agent (Demo rehearsal follow-up)
*   **完成 Feature**: `DEMO-POLISH-001` 手测后修补
*   **变更记录**:
    *   修复 `frontend/src/pages/ConferenceApply.tsx` 在 reload 一个已提交 conference application 时仍显示 `Draft in progress` 的状态漂移；现在已提交记录会显示 `Submitted and under review`。
    *   同步收口 `frontend/src/features/conference/ConferenceApplyForm.tsx` 的交互状态：当 `application.status === submitted` 时，表单字段、`Save draft` 与 `Submit application` 都会锁成只读，避免 reload 后仍出现可编辑假象。
    *   新增 `ConferenceApply.test.tsx` 覆盖“已提交后重开页面”的 presenter-safe 行为，确保不再回退到 draft banner。
*   **验证记录**:
    *   改动前执行通过 `cd frontend && npm run test:run -- src/pages/ConferenceApply.test.tsx`。
    *   按 TDD 先补失败测试，再执行同一命令，`1` 个 test file、`6` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/ConferenceApply.test.tsx src/pages/MyApplications.test.tsx`：`2` 个 test files、`17` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮只修 conference apply 的 submitted reload 状态，没有扩大到 grant apply 的额外 UX 收口。
    *   本地未跟踪文件 `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md` 继续按要求保持不提交。
*   **下一步**: 继续 grant prerequisite / submit 手测，确认 demo applicant 主链已无状态漂移

### 2026-04-26 (Session 29)
*   **Agent 角色**: Coding Agent (Demo rehearsal follow-up)
*   **完成 Feature**: `DEMO-POLISH-002` 手测后修补
*   **变更记录**:
    *   修复 `frontend/src/pages/MyApplications.tsx` 中 draft 行 CTA `Continue draft` 的落点错误；conference / grant draft 现在会基于真实 `sourceSlug` 返回对应的可编辑 apply 页，而不是统一落到只读的 applicant detail `/me/applications/:id`。
    *   为此补齐 `GET /api/v1/me/applications` 的 applicant-safe 列表 contract：`backend/src/serializers/applicationDashboard.ts` 现在序列化 `source_slug`，前端 `dashboardMappers` / `types` / fake provider 同步接入 `sourceSlug`，确保列表页在 real-aligned 模式下也能生成稳定的编辑入口。
    *   扩展 `MyApplications.test.tsx`，覆盖 conference draft 与 grant draft 两条 `continue_draft` 分支，避免后续再把 CTA 退回到只读 detail。
*   **验证记录**:
    *   执行通过 `cd frontend && npm run test:run -- src/pages/MyApplications.test.tsx src/features/dashboard/dashboardMappers.test.ts`：`2` 个 test files、`14` 个 tests 全部通过。
    *   执行通过 `cd backend && npm test -- meApplications.test.ts`：`1` 个 test suite、`6` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/features/dashboard/dashboardMappers.test.ts`：`3` 个 test files、`16` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮仅修正 `Continue draft` 的导航语义与所需最小 contract 字段，没有扩展新模块，也没有改 applicant detail 的只读设计。
    *   本地未跟踪文件 `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md` 继续按要求保持不提交。
*   **下一步**: 继续手测 grant prerequisite / submit 分支，确认 demo rehearsal 其余点击链无断点

### 2026-04-24 (Session 28)
*   **Agent 角色**: Coding Agent (Demo rehearsal follow-up)
*   **完成 Feature**: `DEMO-POLISH-002` 手测后修补
*   **变更记录**:
    *   修正 `frontend/src/pages/MyApplications.tsx` 的 presenter-safe walkthrough shortcut，不再固定指向 fake detail id `review-application-1`。
    *   现在当 `My applications` 已有真实 applicant record 时，shortcut 会直接跳到当前列表里的第一条真实记录；当列表为空时，shortcut 会回落到稳定的 `/conferences` 入口，而不是给出会失败的 seeded detail 链接。
    *   同步更新 `frontend/src/features/demo/demoWalkthrough.ts` 的 applications copy，去掉“seeded detail”假设，并补充 `MyApplications.test.tsx` 覆盖空列表 fallback 与“首条真实记录”两种分支。
*   **验证记录**:
    *   按 TDD 先补失败测试，再执行 `cd frontend && npm run test:run -- src/pages/MyApplications.test.tsx`，验证红灯后转绿。
    *   执行通过 `cd frontend && npm run test:run -- src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx`：`2` 个 test files、`12` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
    *   复跑浏览器手测：`/me/applications` 顶部 shortcut 已改为 `Open latest walkthrough record`，并实际跳转到真实 draft detail `/me/applications/225b38b9-fa2f-4070-84a0-3879a962b620`。
*   **边界与说明**:
    *   本轮只修 walkthrough shortcut 的 real/fake 漂移，没有扩展新的 demo 模块，也没有改后端 schema 或 applicant detail 数据契约。
    *   本地未跟踪文件 `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md` 继续按要求保持不提交。
*   **下一步**: 继续 `CP4 rehearsal cut`，优先复测 grant half 与 presenter narration

### 2026-04-24 (Session 27)
*   **Agent 角色**: Coding Agent (Demo polish)
*   **完成 Feature**: `DEMO-POLISH-001`
*   **变更记录**:
    *   新增共享前端状态组件 `frontend/src/features/demo/DemoStatePanel.tsx` 与 `frontend/src/features/demo/DemoStatusNotice.tsx`，把 demo 页面的 loading / empty / not-found / error 与页内 success / warning / error 反馈统一到同一套 presenter-safe 视觉与文案结构。
    *   `Conferences` / `ConferenceDetail`、`Grants` / `GrantDetail`、`Schools` / `SchoolDetail`、`Partners`、`Prizes` / `PrizeDetail`、`ScholarProfile` 全部改为在 shell 内渲染一致的状态 panel；conference list/detail 新增真实错误态，grant detail 错误态不再停留在 loading 文案。
    *   `Dashboard` 的 `My applications` 卡片现在区分 empty / error / record-present 三种状态；空工作区与加载失败都改成统一 state panel，而不是零散说明文字。
    *   `MyApplications` 改为在加载失败时显示 dedicated error state，不再一边报错一边渲染两个空 section；section 级 empty hint 也收敛到 compact state panel。
    *   `MyApplicationDetail` 现在区分 `loading / not_found / error / ready`，避免把后端失败误报成“Application not found”；错误/缺失状态仍保留稳定返回链。
    *   `ConferenceApply` 与 `GrantApply` 补了统一的页内 notice：保存成功、提交成功、blocked prerequisite、保存/提交失败都走同一 affordance；同时修正“页面 hydrate 到已有 draft 就显示 Draft saved”的语义错误，现改为明确的 “draft already on file / draft in progress”。
    *   `MeProfile` 现在在 load failure 时使用统一 page state，并在成功保存后显示明确的 success notice，而不只是在 badge 上切到 `saved`。
*   **验证记录**:
    *   改动前执行通过 `cd frontend && npm run test:run -- src/pages/Conferences.test.tsx src/pages/Grants.test.tsx src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx src/pages/ConferenceApply.test.tsx src/pages/GrantApply.test.tsx src/pages/MeProfile.test.tsx src/pages/Schools.test.tsx src/pages/Partners.test.tsx src/pages/Prizes.test.tsx src/pages/ScholarProfile.test.tsx`
    *   按 TDD 先补失败测试，再执行同一组 page tests，`12` 个 test files、`55` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run`：`28` 个 test files、`102` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮只处理 demo 页面的状态一致性、presenter-safe 成功/错误反馈与 applicant/public breadth 的状态收口，没有修改后端 schema、没有扩展新模块、没有把 organizer/reviewer 额外重构进来。
    *   本地未跟踪文件 `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md` 按要求保持不提交。
*   **下一步**: `CP4 rehearsal cut` 手测 / walkthrough rehearsal

### 2026-04-24 (Session 26)
*   **Agent 角色**: Coding Agent (Demo polish)
*   **完成 Feature**: `DEMO-POLISH-002`
*   **变更记录**:
    *   在前端新增共享 `demoWalkthrough` / `DemoShortcutPanel`，把 demo-only walkthrough 文案、稳定入口和 presenter-safe shortcut 数据集中到一个前端 helper 层，避免 portal、dashboard、applications、detail 各自漂移。
    *   `Portal.tsx` 新增 “Presenter-safe demo flow” 区块，补了从 public conferences → sign-in → my applications 的稳定演示起点，并把 portal → my applications 的返回链显式化。
    *   `Dashboard.tsx` 新增 “Presenter-safe walkthrough” 区块，并让 “Open my applications” 带上返回上下文，确保从 applicant workspace 进入列表页后仍能稳定回到 dashboard。
    *   `MyApplications.tsx` 现在会读取调用方 `returnContext`，在页头显示可追溯返回入口，新增 seeded walkthrough record shortcut，并把 browse/detail 链路统一挂上返回状态，减少演示时的导航恢复成本。
    *   `MyApplicationDetail.tsx` 现在支持调用方自定义返回文案，同时新增 “Presenter shortcuts” 侧栏，提供 dashboard / portal 快捷跳转，形成稳定的“开始、继续、重启”演示链。
    *   补充并通过了 `Portal`、`Dashboard`、`MyApplications`、`MyApplicationDetail` 的测试，覆盖 walkthrough helper、shortcut CTA 与 return-context 文案。
*   **验证记录**:
    *   改动前执行通过 `cd frontend && npm run test:run -- src/pages/Portal.test.tsx src/pages/Dashboard.test.tsx src/pages/MyApplications.test.tsx src/pages/MyApplicationDetail.test.tsx`，确认相关页面起始状态干净。
    *   按 TDD 先补失败测试，再执行同一组 targeted tests，`4` 个 test files、`15` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run test:run`：`28` 个 test files、`97` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
*   **边界与说明**:
    *   本轮只处理 demo-only walkthrough data、click path、presenter-safe shortcuts 与返回链，不调整后端 schema、不扩展新模块、不顺手做 `DEMO-POLISH-001`。
    *   本地未跟踪文件 `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md` 按要求保持不提交。
*   **下一步**: `DEMO-POLISH-001`

### 2026-04-22 (Session 25)
*   **Agent 角色**: Coding Agent (Frontend / Contract Realignment)
*   **完成 Feature**: `FE-PORTAL-001` 与 `REVIEW` 后端新 contract 对齐（PR #11 follow-up）
*   **上下文**:
    *   PR #11 审阅期间，`REVIEW` Epic（PR #13，commits `aca02e7` / `a06f0ff` / `ec76b55`）合并进 main，改写了 `GET /api/v1/me/applications` 的响应为 applicant-safe 形状。
    *   `feature/portal` fast-forward 合入最新 main 后，原 FE-PORTAL-001 仪表板类型/映射/UI/测试对应的是旧 payload（`status` / `conference_slug` / `grant_slug` / `decision`），与新 applicant-safe 契约不一致 —— 标题回退、status tone、released result 渲染与 CTA 都会在真实数据上漂移。
    *   同事在 PR #11 评论中点出此问题并明确建议"不要回滚后端，在 `feature/portal` 上小改对齐"；本轮即为该对齐。
*   **变更记录**:
    *   `frontend/src/features/dashboard/types.ts` 改为 applicant-safe 域模型：`ViewerStatus`（`draft` / `under_review` / `result_released`）、`NextAction`（`continue_draft` / `view_submission` / `view_result` / `submit_post_visit_report`）、`ReleasedDecision`（`decisionKind` / `finalStatus` / `displayLabel` / `releasedAt`），`MyApplication` 不再包含 `status` / `conference_slug` / `grant_slug` / `decision`，而是 `sourceId` / `sourceTitle` / `linkedConferenceTitle` / `viewerStatus` / `releasedDecision` / `nextAction` / `postVisitReportStatus`。
    *   `frontend/src/features/dashboard/dashboardMappers.ts` 重写 `TransportMyApplication` 与 `fromTransportMyApplication`，把新 snake_case 响应（含 nested `released_decision`）映射到新域模型。
    *   `frontend/src/pages/MyApplications.tsx` 重写 row 渲染：badge tone 优先从 `releasedDecision.finalStatus` 推断（accepted → success / waitlisted → warning / rejected → danger），否则按 `viewerStatus` 推断；显示 `sourceTitle`（fallback "Untitled ..."）、grant 行追加 `linkedConferenceTitle`、所有行显示 `Next step: <nextAction>` 文案。
    *   移除了所有 slug-based CTA（旧 `/conferences/:slug/apply`、`/grants/:slug/apply`、`/conferences/:slug`、`/grants/:slug`）。新 contract 仅暴露 `source_id`、`source_title`，无 slug，因此 dashboard 现在只把 `next_action` 呈现为明确的"下一步"提示，而不是错误的可点链接。"真正的 clickable 目标"需要一个消费 `GET /api/v1/me/applications/:id`（已存在）的专属仪表板详情页（未来独立 PR）。
    *   `frontend/src/pages/MyApplications.css` 增补 `.my-applications__row-linked` 与 `.my-applications__row-next-action`，仅限页面级样式，未扩展 foundation 全局层。
    *   新测试覆盖：`dashboardMappers.test.ts` 3 用例（submitted conference、released accepted conference 含 display_label、draft grant with linked_conference_title），`MyApplications.test.tsx` 6 用例（未登录跳转、双空 section、under-review 会议呈现 "Under review" + "Next step: View submission"、draft grant 呈现 Linked conference + "Next step: Continue draft"、released accepted decision 呈现 "Accepted" + "Next step: View result"、混合分组）。
*   **验证记录**:
    *   执行通过 `cd frontend && npx vitest run`：`13` 个 test files、`43` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
    *   执行通过 `cd backend && npx prisma generate`（REVIEW Epic 新增 `Decision` / `UserRole` 等 Prisma 模型后本地 client 未自动再生，backend 套件会因 `Property 'decision' does not exist on PrismaClient` TS 报错而全部失败）。
    *   执行通过 `cd backend && npm test`（prisma generate 后）：`9` 个 test suites、`39` 个 tests 全部通过；但由于 `feature/portal` 当前还没有 fix `#12`（jest `--runInBand`），并行 SQLite 竞争导致的 flake 依然存在于本分支（5 次抽样中 4 次失败），属于 PR #12 所修；本次改动零后端代码，不新增也不加剧该 flake。
*   **边界与说明**:
    *   本轮仅对齐 `frontend/src/features/dashboard/*` 与 `frontend/src/pages/MyApplications.*`。`Portal.tsx`、`Dashboard.tsx`、`App.tsx`、shell 组件与 foundation CSS 均未触碰。
    *   后端文件零改动，`docs/specs/openapi.yaml` / `docs/planning/` / `backend/prisma/` 均保持只读。
    *   `next_action` 目前只以文案形式呈现，不绑定 href。给到 clickable 去向需要先落地 `/me/applications/:id` 前端详情页（消费已有的后端 `GET /api/v1/me/applications/:id`）；这属于 `INT-PORTAL-001` 或其前置 FE 补页的范围，不在本轮。
    *   `released_decision` 的 tone 映射假设前端可以依赖 `finalStatus` 判断 success / warning / danger；`displayLabel` 直接来自后端（例如 grant 的 "Awarded" / "Not awarded"），前端不做二次翻译。
*   **下一步**: 等 PR #12（`jest --runInBand`）与本轮 PR #11 更新一起 merge，然后在 `feature/portal`（或独立 FE 分支）做两件事：(a) 新建 `/me/applications/:id` 详情页并把 dashboard 的 next step 变成真正的 Link；(b) 补一个 `scripts/me-applications-real-flow-check.mjs` 做真实联调，铺垫 `INT-PORTAL-001`。

### 2026-04-22 (Session 24)
*   **Agent 角色**: Coding Agent (Frontend)
*   **完成 Feature**: `FE-PORTAL-001`
*   **变更记录**:
    *   新增 `frontend/src/features/dashboard/`：`types.ts`（`MyApplication` 域模型 + `DashboardProvider` 接口）、`dashboardMappers.ts`（snake_case ↔ camelCase）、`httpDashboardProvider.ts`（消费 `GET /me/applications`，复用 localStorage Bearer token）、`fakeDashboardProvider.ts`（提供 `setDashboardFakeState` / `resetDashboardFakeState` 供单测）、`dashboardProvider.ts`（按 `import.meta.env.VITEST` 在 fake/http 之间切换）。
    *   新增 `frontend/src/api/me.ts` 单一职责 axios wrapper：`fetchMyApplications(token)` → `GET /api/v1/me/applications`。
    *   新增 `/portal` 公共门户首页（`PortalShell`），列出 conferences / grants 浏览入口和登录/注册/My Applications CTA。
    *   新增 `/me/applications` Applicant Dashboard 列表页（`WorkspaceShell`），按 conference / grant 双 section 展示当前用户的所有申请，复用 `StatusBadge` 把 `draft / submitted / under_review / decided / withdrawn` 映射到 `neutral / info / warning / success / danger`，并按状态生成 `Continue draft` 或 `View conference / View grant` CTA。
    *   新增 `frontend/src/pages/MyApplications.css`，仅承载页面级 grid / 间距，所有卡片、徽章、按钮继续复用 foundation `components.css` 中的 `.surface-card`、`.dashboard-widget`、`.conference-primary-link`、`.conference-empty`、`.conference-inline-message`，未引入新的全局视觉层。
*   **验证记录**:
    *   新增 `frontend/src/features/dashboard/dashboardMappers.test.ts`（2 用例，覆盖 conference + grant 两种 transport payload 的字段映射），与 `frontend/src/pages/MyApplications.test.tsx`（5 用例：未登录跳转、双空 section、submitted 会议申请呈现 view-conference CTA、draft grant 申请呈现 continue-draft CTA、混合两类 application 时的分组渲染）。
    *   执行通过 `cd frontend && npx vitest run`，结果为 `12` 个 test files、`35` 个 tests 全部通过。
    *   执行通过 `cd frontend && npm run build`（`tsc -b && vite build`），无类型或构建错误。
    *   仓库级 `npm run test:smoke` 在 3 次连续运行中 2 次通过；第 3 次失败为 `tests/grants.test.ts` 后端 flake（详见下方"已知问题"），与本轮前端改动无关（本轮零后端文件改动）。
*   **边界与说明**:
    *   未编辑 `frontend/src/App.tsx`（CLAUDE.md 禁止动中央路由），因此公共门户页路由是 `/portal` 而不是 `/`；`/` 仍维持原有 `Navigate to="/login"` 行为。如需把 `/` 改为公共门户入口，应作为独立后续任务由用户决定。
    *   未触碰 `frontend/src/pages/Dashboard.tsx`：保留其 AUTH-era 占位面板，FE-PORTAL-001 通过新页 `/me/applications` 提供真正的申请列表，二者并存。
    *   未触碰任何后端代码、数据库迁移、契约文件，本轮改动严格收敛在 `frontend/src/`。
    *   未触碰 `docs/planning/` 下的 feature-list JSON；保持本仓库 "planning 只读" 约定。
    *   `INT-PORTAL-001` 依然被阻塞在 `INT-REVIEW-001`：dashboard 上的 `decision` 字段在前后端两侧都按 `null` 处理，`released vs unreleased` 完整语义需要 REVIEW Epic 落地后回头补齐。
*   **已知问题（pre-existing，与本轮无关）**:
    *   `cd backend && npm test` 在多次连续运行中存在 ~50% 的 flake（10 次抽样中 5 次失败）：`tests/grants.test.ts` 中 `creates a grant draft only when a submitted linked conference application exists` 与 `updates and submits a grant draft while preserving linked conference rules` 偶发性返回 422 而非预期的 201。失败时根因都指向 `requireEligibleLinkedConferenceApplication` 拒绝 prereq lookup，疑似多 test file 之间通过共享 SQLite 的 cascade-delete 行为产生竞争。该测试在隔离运行（`--runInBand` 单文件）时 100% 通过；本轮前端改动未修改任何后端代码，flake 在 `main` 上即已存在，建议作为独立 BE 修复任务跟进。
*   **下一步**: 当 `REVIEW` Epic 启动后再回到 `PORTAL`，把 `decision` 字段在 dashboard 上接通 release 语义，并在 `scripts/` 下补一个 `me-applications-real-flow-check.mjs` 真实联调脚本，作为 `INT-PORTAL-001` 的前置铺垫。

### 2026-04-22 (Session 23)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-PORTAL-001`
*   **变更记录**:
    *   新增 `GET /api/v1/me/applications` 聚合接口，返回当前登录用户在 `conference_application` 与 `grant_application` 两类下的全部 applications，按 `updated_at` 倒序排列。
    *   新增 `backend/src/serializers/applicationDashboard.ts`，提供 dashboard 视图专用的 `serializeMyApplicationItem`。该 serializer 始终把 `decision` 输出为 `null`，把决策可见性的实现完整推迟到 `BE-REVIEW-001`：当前数据库尚未存在 `Decision` 表，仅有 `Application.decidedAt`，因此即使 `status === 'decided'` 仍不暴露最终结果，符合 "released vs unreleased" 的产品约束。
    *   `backend/src/controllers/me.ts` 新增 `listMyApplications`，使用单次 `findMany` 同时 include conference 与 grant 的 `id/slug/title`，避免 N+1。`backend/src/routes/me.ts` 自动挂载点新增 `GET /applications` 路由。
    *   在 `docs/specs/openapi.yaml` 中补充 `/me/applications` 的 GET 定义，并明确标注 `decision` 字段在 REVIEW Epic 落地前保持 `null`。
*   **验证记录**:
    *   新增 `backend/tests/meApplications.test.ts`（6 用例）：401 未授权、空列表、自有数据隔离、conference application 上下文映射、grant application 上下文映射、decided application 仍保持 `decision: null`。
    *   执行通过 `cd backend && npm test`，结果为 `8` 个 test suites、`34` 个 tests 全部通过。
    *   执行通过仓库级 `npm run test:smoke`（前端 build + 后端 jest）。
*   **边界与说明**:
    *   本轮没有新增 `Decision` Prisma 模型、决策发布接口、或 organizer/reviewer 评审分配能力 —— 这些归属 `BE-REVIEW-001`。
    *   `decision` 字段在响应中以 `null` 占位，等 `BE-REVIEW-001` 落地 `Decision` 表与 `releaseStatus` 后再回头让 dashboard serializer 在 `released` 时填充 `final_status` / `released_at` / `external_notes`。
    *   未触碰 `docs/planning/` 下的 feature-list JSON；保持本仓库 "planning 只读" 约定。
    *   未启动 `FE-PORTAL-001`，按 "One Feature at a Time" 原则留作下一轮独立会话。
*   **下一步**: `FE-PORTAL-001`（公众门户首页 + Applicant Dashboard UI）。建议复用 `PortalShell` 做公众入口、`WorkspaceShell` 承载 dashboard，并以 `GET /api/v1/me/applications` 为真实数据源直接接 `httpProvider`，避免再走 fake provider。

### 2026-04-21 (Session 22)
*   **Agent 角色**: Coding Agent (Frontend / QA Follow-up)
*   **完成 Feature**: `GRANT` applicant-flow stabilization (post-INT follow-up)
*   **变更记录**:
    *   修复 `/grants` 页在真实 API 请求失败时永久停留在 `Loading grants...` 的问题；页面现在会退出 loading 并显示明确错误态。
    *   修复 `conference` / `grant` 两侧 real-mode HTTP adapter 的 response 解包错误；真实运行时现在统一从 backend 返回的 `response.data` wrapper 中读取 `items`、`conference`、`grant` 与 `application`。
    *   将 `GrantApply` 页读取 prerequisite conference application 的路径收敛到共享 `conferenceProvider`，避免 `CONF` / `GRANT` 再次出现 transport 形状漂移。
    *   修复 prerequisite 未满足时 grant apply 页把三个文本框整体禁用的问题；当前行为调整为“允许先填写文本，但 `Save draft` / `Submit application` 继续禁用直到 linked conference application 可用”。
    *   为本地手测保留型数据补齐了一条 published grant 与一条 draft grant，用于确认 public list/detail 只展示 published grant，draft grant 继续保持隐藏。
*   **验证记录**:
    *   执行通过 `cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend && npm run test:run -- src/pages/Grants.test.tsx src/pages/GrantApply.test.tsx src/pages/ConferenceApply.test.tsx src/features/grant/httpGrantProvider.test.ts src/features/conference/httpConferenceProvider.test.ts`
    *   执行通过 `cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend && npm run build`
    *   真实手测通过：
        *   `/grants` 正常展示 published grant，draft grant 不出现在 public list
        *   `/grants/:slug` detail 正常打开，draft slug 公共访问返回 `Grant not found`
        *   conference 未提交前，grant apply 页显示 prerequisite 提示，linked conference application 为 `Not available yet`
        *   conference 提交后，grant apply 页出现真实 `linked_conference_application_id`，grant draft 可创建、刷新后可回填、最终可 submit
        *   浏览器 `Network` 证据确认 `conference_application` 与 `grant_application` 为两条独立记录，且 `grant.linked_conference_application_id` 正确指向对应 conference application
*   **边界与说明**:
    *   本轮没有扩大到 organizer grant CRUD、review/decision release、dashboard 聚合、post-visit report。
    *   本地 hand-test 数据是直接 seed 到 `backend/prisma/dev.db` 的保留型数据，不属于仓库提交内容；后续若再次执行 `grant-real-flow-check.mjs`，会清理 integration slug 对应的临时 fixture。
    *   已知 `CONF` 的 stale `Draft saved.` banner 仍保持原样，没有纳入这轮修复。
*   **下一步**: `GRANT` Epic 保持完成状态，可进入 `REVIEW` Epic。

### 2026-04-21 (Session 21)
*   **Agent 角色**: Coding Agent (Integration)
*   **完成 Feature**: `INT-GRANT-001`
*   **变更记录**:
    *   新增 `backend/tests/helpers/grantIntegrationFixture.ts`，通过 Prisma 直接 seed 固定的 published conference + published grant fixture，避免为联调额外扩展 organizer grant CRUD。
    *   新增 `scripts/grant-real-flow-check.mjs` 与根脚本入口 `test:grant:int`，可复跑地验证真实 `GRANT` 主链路：公开 grant 读取、conference prerequisite 阻断、conference submit 后 grant draft create/update/submit，以及 conference/grant 仍为两条独立 application 记录。
    *   修正了 `frontend/src/features/conference/httpConferenceProvider.ts` 的真实运行时 adapter 形状；此前它错误地把 `frontend/src/api/conference.ts` 返回的 `response.data` 再当作 AxiosResponse 读取，这会破坏真实 `CONF` / `GRANT` 运行路径。对应前端测试契约已同步到真实 wrapper 形状。
    *   新增 `backend/tests/grantIntegrationFixture.test.ts`，保证 deterministic fixture helper 可重复创建、不会重复插入同一条 published grant fixture。
*   **验证记录**:
    *   执行通过 `cd /Users/brenda/Projects/Asian-Mathematical-Network/frontend && npm run test:run -- src/features/conference/httpConferenceProvider.test.ts`
    *   执行通过 `cd /Users/brenda/Projects/Asian-Mathematical-Network/backend && npx jest tests/grantIntegrationFixture.test.ts --runInBand`
    *   执行通过 `node /Users/brenda/Projects/Asian-Mathematical-Network/scripts/grant-real-flow-check.mjs`，真实联调成功验证：
        *   `/grants`、`/grants/:slug`、`/grants/:slug/apply` 前端路由可由本地 dev server 提供
        *   未提交 conference application 前，grant draft 创建返回 prerequisite failure
        *   提交 conference application 后，grant draft create/update/submit 成功
        *   `conference_application` 与 `grant_application` 保持为独立记录
*   **边界与说明**:
    *   本轮未新增 organizer grant CRUD、review/decision release、dashboard 聚合、post-visit report。
    *   已知 `CONF` 的 stale `Draft saved.` banner 问题仍保持原样，没有扩大修复范围。
    *   `docs/planning/` 继续保持只读，本轮只更新 `PROGRESS.md`。
*   **下一步**: `GRANT` Epic 已完成，可进入 `REVIEW` Epic。

### 2026-04-21 (Session 20)
*   **Agent 角色**: Coding Agent (Backend)
*   **完成 Feature**: `BE-GRANT-001`
*   **变更记录**:
    *   为 `GRANT` Epic 新增真实的 `GrantOpportunity` Prisma 模型、SQLite 迁移，以及 grant 侧索引/唯一约束；`Application` 表现在具备 `grantId` 外键和 grant 申请唯一性约束。
    *   新增 `GET /api/v1/grants`、`GET /api/v1/grants/:slug`、`GET /api/v1/grants/:id/application-form`、`GET /api/v1/grants/:id/applications/me`、`POST /api/v1/grants/:id/applications`，完成公开 grant 读取和 applicant grant draft 创建/回读闭环。
    *   新增 grant payload parser / prerequisite helper，后端会强制校验：grant draft 必须关联当前用户本人、同一 linked conference、且已 `submitted` 的 `conference_application`。
    *   将共享 applicant mutation 路径 `PUT /api/v1/me/applications/:id/draft` 与 `POST /api/v1/me/applications/:id/submit` 泛化到 `grant_application`，同时保持既有 `conference_application` 行为不变。
    *   新增 `backend/tests/grants.test.ts`，覆盖 grant public reads、draft create/read、shared me update/submit；并补充 `docs/specs/openapi.yaml` 中这次真实实现的 grant 路径留档。
*   **验证记录**:
    *   执行通过 `cd backend && npx jest tests/grants.test.ts --runInBand`
    *   执行通过 `cd backend && npx jest tests/conferences.test.ts --runInBand`
    *   执行通过 `cd backend && npm test`，结果为 `4` 个 test suites、`24` 个 tests 全部通过
*   **边界与说明**:
    *   本轮未实现 organizer grant CRUD、decision release、applicant dashboard grant 聚合、post-visit report。
    *   按用户要求，`docs/planning/` 视为只读，因此未修改 feature-list JSON 状态文件；本次完成状态仅记录在 `PROGRESS.md` 与 `docs/specs/openapi.yaml`。
    *   已知 `CONF` 的 stale `Draft saved.` banner 问题未被扩大修复，保持原样。
*   **下一步**: `FE-GRANT-001`

### 2026-04-21 (Session 19)
*   **Agent 角色**: Coding Agent (Integration Stabilization)
*   **完成 Feature**: `INT-CONF-001` (post-integration bugfix)
*   **变更记录**:
    *   修复了 Applicant 在会议申请页 `Save draft` 后刷新无法回显已保存草稿的问题；根因是前端页面只加载 conference detail 和 application form schema，没有读取当前用户在该 conference 下的既有 application。
    *   后端新增 `GET /api/v1/conferences/:id/applications/me`，用于按 conference 读取当前登录用户的 `conference_application`；前端 provider 与申请页加载逻辑已接入该接口，实现页面刷新后的 draft hydrate。
    *   补充并通过了前端回归测试（申请页 hydrate / 既有 draft 更新 / provider 404->null 映射）、前端构建验证，以及 backend `conferences.test.ts` 中对“读取我的会议申请草稿”的接口验证。
*   **当前结论**:
    *   `CONF` 主流程通过：Organizer 创建/发布会议，Applicant 保存 draft、刷新回读、提交申请均已验证通过。
    *   已知非阻塞 UI 问题：刷新一个已 `submitted` 的 application 后，页面顶部提示文案仍可能显示 `Draft saved.`，该问题记录为后续处理项，不阻塞 `CONF` 完成判定。
*   **下一步**: `CONF` 可继续保持完成状态，进入 `GRANT` Epic。

### 2026-04-20 (Session 18)
*   **Agent 角色**: Coding Agent (Integration)
*   **完成 Feature**: `INT-CONF-001`
*   **变更记录**:
    *   将 conference provider 从本地 fake 实现切换为真实 conference/application API，并在测试环境继续保留 fake provider，保持会议页面单元测试稳定。
    *   新增 conference HTTP adapter，将 `snake_case` transport payload 映射到 conference domain model，并把 duplicate draft 的 `409` 响应转换为前端可识别的 `CONFLICT` 错误。
    *   通过真实 backend API 验证了 Organizer 创建并发布会议、Applicant 更新 profile、公开会议 list/detail/application-form、会议申请 draft 更新与 submit 的完整闭环。
    *   验证了 frontend dev server 可提供 `/conferences`、`/conferences/:slug`、`/conferences/:slug/apply`、`/organizer/conferences/:id` 路由，并执行通过仓库级 `npm run test:smoke`。
*   **下一步**: `CONF` Epic 可视为完成，可转入 `GRANT` Epic。

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
