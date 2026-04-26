# 项目进度日志 (Progress Log)

> 本文件是所有 Agent 开发的 "State of the World"。在每次交接 (Handoff) 时由 Agent 追加更新。

## 当前项目状态
*   **最新版本**: V4.0-Optimized
*   **总览**: `AUTH`、`PROFILE`、`CONF`、`GRANT` 与 `REVIEW` 五个 Epic 已完成；`PORTAL` Epic 的 `BE-PORTAL-001` 已在 main，`FE-PORTAL-001` 经本轮 contract realignment 后重新对齐到 REVIEW-era 的 applicant-safe 形状，等待 merge；`INT-PORTAL-001` 仍需单独的真实联调验证。

---

## 📅 Handoff 历史记录

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
