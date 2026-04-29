# Asiamath D0 Rehearsal Checklist (Sprint 1 Local Round 1)

> Updated: 2026-04-29  
> Owner: `DR-004` / `PMB-004`  
> Purpose: 为 `d0-story` + role workspace 的第一轮本地人工 rehearsal 提供统一执行清单。  
> Scope note: 本文档只定义本地 rehearsal 执行方式，不替代 hosted preview 的 `DR-005` / `PMB-005` reseed + smoke runbook。

## 1. 适用范围与成功标准

### 1.1 本轮适用范围

本轮 checklist 只覆盖同一候选版本上的本地人工验收，目标是回答：

1. `Portal -> conferences -> conference detail -> auth handoff -> applicant workspace -> released result` 这条 `d0-story` 主链是否能在同一轮浏览器走查里稳定走通。
2. reviewer / organizer 的 sample touchpoint 是否具备稳定 workspace 壳层，包括主返回、`Back to portal` 与 `Account` affordance。
3. public portal / scholars / opportunities 的关键公开面是否仍与当前 `d0` 基线和 demo seed 口径一致。

### 1.2 本轮明确不覆盖

- 不执行 Railway / Vercel hosted reseed 或 preview smoke。
- 不做新功能扩展、配置调整或代码修复。
- 不把 reviewer / organizer 深化成超出 sample touchpoint 的完整新 workflow。
- 不要求 secondary breadth 页面在本轮全部重新验收。

### 1.3 成功标准

本轮本地 rehearsal 只有在以下条件同时满足时，才可视为通过：

- 同一轮执行全程使用同一种运行模式，不混用 `5173/3000` 与 `5175/3001`。
- applicant must-pass path 无 P0 阻塞。
- showcase applicant 与 clean applicant 的关键数据状态符合当前 seed 预期。
- reviewer 与 organizer 的 entry / queue / detail / back 链路稳定。
- admin 预览面已被明确记录为 `Pass`、`N/A` 或带优先级的问题，不能静默跳过。
- public portal / scholars / opportunities 关键回归项已复核。
- 所有偏差都已进入 issue log，并附上复现、期望/实际与截图位置。

## 2. 运行模式选择

### 2.1 两种允许的本地模式

| 模式 | 端口口径 | 用途 | 是否作为本 checklist 主路径 |
|---|---|---|---|
| 默认本地开发 | frontend `5173` + proxy -> backend `3000` | 轻量 UI 开发、日常联调 | 否 |
| acceptance / real-flow | frontend `5175` + direct API base -> backend `3001` | 浏览器验收、真实登录/申请链路、排查 `3000/3001` 假问题 | 是 |

### 2.2 本 checklist 采用的主路径

本 checklist 默认采用 `acceptance / real-flow` 作为主路径，原因如下：

- `DR-004` / `PMB-004` 的目标是完成一次真实 `d0-story` + role workspace 人工验收，而不是一次轻量 UI 浏览。
- 当前项目已经把 `5175 + direct API base -> 3001` 明确为 browser acceptance 的一等模式。
- applicant 登录、workspace 切换、released result、grant post-visit report 这类链路更适合在显式直连 `3001` 的环境下复核，避免 proxy 造成假问题。

### 2.3 模式纪律

- 在本轮执行开始前先定模式，整轮不要混用。
- 如果必须对比 proxy 模式，先完成或中止当前 acceptance 轮次，再单独开一次 differential triage。
- 本轮记录中的浏览器地址、API 地址、截图与 issue log 都必须带上当前模式说明。

## 3. Preflight

### 3.1 基线与运行口径

- [ ] 本次 rehearsal 所在候选版本已记录 branch 与 commit。
- [ ] 在正式 cutover 前，当前稳定 `d0` 基线仍按 `codex/demo-d0-postgres-deploy` 理解；若本地验证的是 merge 后候选提交，也要在 handoff 里写清楚与该基线的关系。
- [ ] 本轮确认采用 `acceptance / real-flow`：frontend `5175`，backend `3001`。

### 3.2 Env 与数据库

- [ ] `backend/.env` 已存在；若本机首次启动，可先在 `backend/` 内复制 `.env.example`。
- [ ] 官方默认 Postgres 口径为 `127.0.0.1:5432`；若本机只能使用 `5433`，必须同时覆盖 `DATABASE_URL` 与 `TEST_DATABASE_URL`，不要只改其一。
- [ ] 在当前 shell 里显式导出 `backend/.env`，因为 root seed 命令不会自动读取它。

```bash
cd backend
cp .env.example .env  # 仅在本地文件缺失时执行
set -a
source .env
set +a
cd ..
```

- [ ] `DATABASE_URL` 指向本地 dev DB，且数据库可连接。
- [ ] 如需从零准备数据库，先确保 `asiamath_dev` / `asiamath_test` 已创建。

### 3.3 服务启动

- [ ] 构建稳定 backend：

```bash
npm run build --workspace backend
```

- [ ] 以 acceptance 口径启动 backend：

```bash
cd backend
PORT=3001 npm run start
```

- [ ] 以 acceptance 口径启动 frontend：

```bash
VITE_API_BASE_URL="http://127.0.0.1:3001/api/v1" npm run dev --workspace frontend -- --host 127.0.0.1 --port 5175
```

- [ ] 浏览器目标地址固定为 `http://127.0.0.1:5175`。
- [ ] 健康检查通过，至少确认 `curl -i http://127.0.0.1:3001/api/v1/auth/me` 能收到 HTTP 响应；未登录返回 `401` 可接受，连接失败不可接受。

### 3.4 Seed 与数据预期

- [ ] 在导出 env 后，从仓库根目录运行本地 demo seed：

```bash
npm run seed:demo
```

- [ ] 进入浏览器前，先带着以下数据预期执行，不在走查过程中临时猜测：
  - public `/conferences` 预期有 `3` 个 published 项。
  - public `/grants` 预期有 `2` 个 published 项。
  - showcase applicant 预期有 `4` 个 applications。
  - clean applicant 预期有 `0` 个 applications。
- [ ] 若某条公开 conference 因为 `closed` 状态没有出现在 public `/conferences`，默认按“符合当前 contract”处理，不直接判定为 bug。

### 3.5 账号与浏览器准备

| 角色 | 是否必需 | 用途 | 备注 |
|---|---|---|---|
| showcase applicant | 必需 | released result + post-visit report 主讲路径 | 当前文档已知账号：`demo.showcase.applicant@asiamath.org` |
| clean applicant | 必需 | 零申请空态与 `Browse opportunities` | 当前文档已知账号：`demo.applicant@asiamath.org` |
| reviewer | 必需 | reviewer workspace entry / queue / detail | 本地操作者预先准备 |
| organizer | 必需 | organizer workspace entry / queue / detail | 本地操作者预先准备 |
| admin | 条件性 | `/admin/governance` 或 admin landing 预览 | 若本地没有可用 admin 账号，必须在 handoff 里明确记为 `N/A` |

- 若直接使用当前 demo seed 账号，默认共享密码为 `demo123456`；若本地环境另有覆盖，必须在本轮 handoff 中显式写清楚。
- [ ] 使用干净浏览器 profile 或无痕窗口开始本轮。
- [ ] 在角色切换前允许手动登出或清理本地 session，但不得靠编辑数据跳过问题。
- [ ] 如果 reviewer / organizer / admin 任一账号在 preflight 阶段不可用，先记录环境 blocker，再决定是否继续 applicant-only 走查。

## 4. Applicant 主链路逐步检查项

### 4.1 Showcase applicant 主讲路径

- [ ] 打开 `http://127.0.0.1:5175/portal`。
  期望：页面正常渲染；portal 入口、featured opportunities、scholar teaser 可见；无阻塞式 runtime error。

- [ ] 从 portal 进入 `/conferences`。
  期望：公开列表正常渲染，并能看到当前 published conferences：
  `Integration Grant Conference 2026`、`Regional Topology Symposium 2026`、`Number Theory Collaboration Workshop 2026`。

- [ ] 打开任一 conference detail，并从详情页触发登录或 applicant handoff。
  期望：detail 正常展示；auth handoff 不丢失逻辑返回目标。

- [ ] 以 showcase applicant 登录。
  期望：登录成功后进入 applicant 目标面；不会回到错误角色或死路页面。

- [ ] 打开 `/me/applications`。
  期望：当前账号能看到 `4` 个 applications，并覆盖以下状态组合：
  - 一个 `under_review` conference application
  - 一个 released accepted conference result
  - 一个 released rejected conference result
  - 一个 released accepted grant result，且 `post_visit_report_status = submitted`

- [ ] 打开一个 released conference result detail，再返回列表。
  期望：结果面为 applicant 可见版本；返回链稳定回到 `/me/applications`。

- [ ] 打开 released accepted grant result detail。
  期望：grant result 渲染正确；`post-visit report` 已提交状态可见；没有 dead-end CTA。

- [ ] 从 applicant workspace 验证 public 回流 affordance。
  期望：`Back to portal` 或 `Browse opportunities` 可以把用户带回公共浏览面，且不会破坏登录态。

- [ ] 退出 showcase applicant。
  期望：登出后公共入口恢复正常，不残留错误角色壳层。

### 4.2 Clean applicant 空态路径

- [ ] 以 clean applicant 登录并打开 `/me/applications`。
  期望：列表为空；空态文案与 CTA 自洽；当前账号没有脏数据残留。

- [ ] 从 clean applicant 空态使用 `Browse opportunities`。
  期望：能回到 public opportunities 流；链路不要求口头补救。

## 5. Reviewer / Organizer / Admin Workspace 检查项

### 5.1 Reviewer workspace

- [ ] 以 reviewer 账号登录。
  期望：若该账号同时拥有 applicant + reviewer workspaces，先落在共享 applicant root 也可接受，但必须能看到稳定的 workspace switcher。

- [ ] 从 applicant 切到 reviewer workspace。
  期望：reviewer root 稳定加载；页头角色语义正确；不应错误显示 applicant-only `Browse opportunities`。

- [ ] 打开 reviewer queue，再进入 detail，再使用主返回回到 queue。
  期望：`queue -> detail -> back` 走逻辑父级，而不是依赖浏览器历史碰运气。

- [ ] 在 reviewer root 与 detail 两处都检查 `Back to portal` 与 `Account`。
  期望：两个 affordance 都可见、位置稳定、动作正确。

### 5.2 Organizer workspace

- [ ] 以 organizer 账号登录。
  期望：`/dashboard` 落在 organizer 语义下，而不是 applicant aggregation。

- [ ] 从 organizer landing 进入 organizer workspace / queue。
  期望：主入口正确，壳层稳定，有明确主返回。

- [ ] 打开 organizer application detail，再返回 queue。
  期望：detail 页主返回回到逻辑上一级；不需要依赖浏览器后退才能继续。

- [ ] 在 organizer root 与 detail 两处都检查 `Back to portal` 与 `Account`。
  期望：两个 affordance 可见且动作正确。

### 5.3 Admin workspace

- [ ] 若本地已准备 admin-capable 账号或明确的 admin 入口，先登录并确认不会错误落入 applicant widget。
  期望：dashboard / landing 角色语义与账号一致。

- [ ] 打开 `/admin/governance`。
  期望：页面可正常打开；清楚呈现 preview-only 语义；无阻塞式 runtime error。

- [ ] 记录 admin 检查结果。
  期望：如果本轮没有本地 admin 账号或入口，就明确写成 `N/A` 与原因，而不是省略。

## 6. Public Portal / Scholars / Opportunities 关键回归项

- [ ] `/portal` 在登出态与登录态都能正常打开。
  期望：公共入口结构稳定，portal scholar teaser 仍可见。

- [ ] 从 `/portal` 进入 `/scholars`。
  期望：scholar directory 展示真实公开 profile 数据，而不是明显的占位或断裂状态。

- [ ] 在 `/scholars` 中检查公开数据是否自洽。
  期望：当前目录至少应呈现公开 scholar / cluster 语义；若本地 seed 未漂移，可见公开 scholars 与 `Number Theory`、`PDE` 等 clusters。

- [ ] 打开一个 public scholar detail。
  期望：公开 profile 可见；若命中 unavailable/hidden 状态，应表现为受控空态而不是 crash。

- [ ] 复核 public opportunities 列表口径。
  期望：`/conferences` 只显示 published conferences；`/grants` 只显示 published grants；当前 seed 预期标题如下：
  - conferences: `Integration Grant Conference 2026`、`Regional Topology Symposium 2026`、`Number Theory Collaboration Workshop 2026`
  - grants: `Integration Grant 2026 Travel Support`、`Number Theory Collaboration Travel Support 2026`

- [ ] 复核公开返回链。
  期望：至少完成一轮 `portal -> conferences -> detail -> conferences -> portal`，并确认返回链稳定。

## 7. Issue Log 模板

### 7.1 优先级定义

- `P0`: 阻塞 must-pass path、阻塞登录/角色进入、或导致演示必须靠口头补救才能继续。
- `P1`: 不阻塞主讲路径，但破坏 role workspace 稳定性、public credibility 或 demo 可信度。
- `P2`: 轻微文案、样式、空态、辅助 affordance 或可接受的 preview polish 问题。

### 7.2 记录模板

| Issue ID | Priority | Surface / Route | Role / Account | Repro Steps | Expected | Actual | Screenshot Path | Notes / Next Action |
|---|---|---|---|---|---|---|---|---|
| `R1` | `P0/P1/P2` | `/path` | `showcase applicant` | `1. ... 2. ... 3. ...` | `...` | `...` | `tmp/rehearsal/2026-04-29/r1.png` | `...` |
| `R2` | `P0/P1/P2` | `/path` | `reviewer` | `1. ... 2. ... 3. ...` | `...` | `...` | `tmp/rehearsal/2026-04-29/r2.png` | `...` |

### 7.3 每条 issue 至少要写清楚

- 复现发生在哪一种模式：默认本地开发，还是 acceptance。
- 是 seed / env 问题，还是产品行为问题。
- 是否可稳定复现。
- 是否影响 `d0-story` 主讲路径，还是只影响次级 breadth。

## 8. 结束条件与 Handoff 字段

### 8.1 本地 rehearsal 结束条件

- [ ] Applicant must-pass path 已完整走完。
- [ ] Showcase applicant 与 clean applicant 数据状态已对过。
- [ ] Reviewer 与 organizer workspace sample touchpoint 已完成。
- [ ] Admin 已明确记录为 `Pass`、`N/A` 或具体 issue。
- [ ] Public portal / scholars / opportunities 回归已完成。
- [ ] 所有问题都已进入 issue log，并分配 `P0/P1/P2`。

若出现以下任一情况，本轮应直接记为未通过，不宣称 `DR-004` 已完成：

- 任一 applicant 主链出现 `P0`
- reviewer / organizer 无法进入基本 workspace
- seed / env 不稳定到无法得到可信结论
- 账号缺失导致关键角色完全无法覆盖，且未在 handoff 中显式声明

### 8.2 Handoff 字段

| 字段 | 待填写内容 |
|---|---|
| Date / Time | |
| Operator | |
| Branch | |
| Commit SHA | |
| Mode | `acceptance / real-flow` |
| Frontend URL | `http://127.0.0.1:5175` |
| Backend URL | `http://127.0.0.1:3001` |
| DB Port | `5432` or local override such as `5433` |
| Seed Command Run | `npm run seed:demo` / not rerun / other |
| Accounts Used | showcase applicant / clean applicant / reviewer / organizer / admin |
| P0 Count | |
| P1 Count | |
| P2 Count | |
| Screenshots Folder | |
| Blocking Questions | |
| Recommended Next Step | `DR-005 hosted smoke` / `DR-006 blocker fix` / `PMB-007 demo kit` |

### 8.3 Handoff 判定建议

- 若 `P0 Count = 0`，且 applicant + reviewer + organizer 主面都稳定，则本地 rehearsal 可交给下一步 hosted smoke 或 demo kit 整理。
- 若存在 `P0`，先进入 `DR-006` blocker 修复，再重开本地 rehearsal。
- 若只有 `P1/P2`，可继续推进，但必须在 handoff 里明确哪些问题会影响 presenter confidence。
