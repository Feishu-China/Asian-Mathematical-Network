# Asiamath d0 Hosted Preview Reseed + Smoke Runbook

> Date: 2026-04-29  
> Covers: `DR-005` / `PMB-005`  
> Purpose: 把 hosted `d0` preview 恢复到可演示状态，并用一套固定步骤验证 Railway backend preview 与 Vercel frontend preview 没有发生数据、部署来源或环境漂移。  
> Non-goals: 不改产品代码，不改脚本，不改 Railway/Vercel/GitHub 配置；这里只记录可执行 runbook。

---

## 1. 适用范围与前提假设

### 1.1 何时使用

在以下场景使用本 runbook：

- demo 前需要把 hosted preview 恢复到已知稳定数据
- hosted preview 看起来“能打开但数据不对”
- push 之后 preview 页面看起来没更新
- 需要判断问题是 seed、环境变量、部署来源，还是浏览器缓存

### 1.2 当前冻结口径

按 2026-04-29 的 freeze 文档，当前 hosted `d0` preview 仍假定来自：

- source branch: `codex/demo-d0-postgres-deploy`

在 cutover 条件满足前：

- `main` 是代码主线
- `main` 不是默认可假定的当前 hosted preview 部署来源
- hosted smoke 应先按 `codex/demo-d0-postgres-deploy` 口径判断对错

### 1.3 当前 hosted 拓扑假设

- Railway project: `asiamath-demo-d0-backend-preview`
- Railway backend service: `backend`
- Railway database service: `Postgres`
- Railway backend public domain: `https://backend-production-2d8c.up.railway.app`
- Vercel preview project: `asiamath-demo-d0-frontend-preview`

如果这些名字或 URL 已变，先记录差异，再继续本 runbook。

### 1.4 重要操作约束

- `railway run <command>` 是本地执行，不是远程容器执行。
- 本地 reseed 默认不要依赖 backend service 的 `DATABASE_URL`，因为它可能是 `postgres.railway.internal`。
- 本地 hosted reseed 必须优先使用 `Postgres` service 的 `DATABASE_PUBLIC_URL`。
- Vercel preview URL 是 immutable 的；新 push 后应打开最新 preview URL，而不是复用旧链接。

### 1.5 当前 API smoke 口径说明

当前 backend 没有单独的 `/api/v1/portal` route。  
因此本 runbook 里“public portal API smoke”指：

- `GET /api/v1/conferences`
- `GET /api/v1/grants`

而 portal scholar teaser 的真实数据用以下接口侧验：

- `GET /api/v1/scholars`

这部分口径来自当前 route 结构与 frontend API client 的现状，而不是另一个独立 portal backend endpoint。

---

## 2. 所需访问权限 / 凭证 / 环境变量清单

### 2.1 平台与本地权限

需要具备：

- Railway 项目只读 + 执行 reseed 所需访问权
- Vercel preview 项目只读 + 触发同配置 redeploy 的权限
- 本地仓库 checkout 与 `npm` 可执行环境
- 本地 `railway` CLI
- 浏览器
- 可选：`curl` 与 `jq`，便于 API smoke

### 2.2 账号与凭证

本 runbook 至少需要以下 demo 账号：

| 用途 | Email | 预期状态 | 备注 |
|---|---|---|---|
| clean applicant | `demo.applicant@asiamath.org` | `0` applications | 用于验证空态 |
| showcase applicant | `demo.showcase.applicant@asiamath.org` | `4` applications | 用于验证预置 workflow |

当前 seed 实现假定 demo 账号共享同一密码：

- password: `demo123456`

如果实际登录失败，不要先改 hosted 配置；先把它归类为“seed / credential drift”并记录。

### 2.3 推荐 shell 变量

在本地 shell 里准备以下变量：

```bash
export PREVIEW_SOURCE_BRANCH='codex/demo-d0-postgres-deploy'
export BACKEND_BASE_URL='https://backend-production-2d8c.up.railway.app'
export FRONTEND_PREVIEW_URL='https://<latest-vercel-preview>.vercel.app'
export SHOWCASE_EMAIL='demo.showcase.applicant@asiamath.org'
export CLEAN_EMAIL='demo.applicant@asiamath.org'
export DEMO_PASSWORD='demo123456'
```

Railway reseed 前还需要：

```bash
export DATABASE_URL='postgresql://<from-Postgres-DATABASE_PUBLIC_URL>?schema=public'
```

如果 `DATABASE_PUBLIC_URL` 已带 query string，只需确保最终连接串包含 `schema=public`。

### 2.4 Vercel preview 关键环境变量

Hosted frontend preview 需要确认：

- `VITE_API_BASE_URL=${BACKEND_BASE_URL}/api/v1`

原因是当前 frontend client 在 `VITE_API_BASE_URL` 为空时会退回相对路径 `/api/v1`；这对本地 Vite proxy 成立，但对 Vercel preview 不是安全默认值。

---

## 3. Railway preview reseed 步骤

### 3.1 先确认 link 和 service 拓扑

在仓库根目录执行：

```bash
railway status
railway service list
railway variable list --json
railway variable list -s Postgres --json
```

应确认：

- 当前 link 指向 `asiamath-demo-d0-backend-preview`
- backend service 名为 `backend`
- attached database service 名为 `Postgres`
- `Postgres` service 变量里能找到 `DATABASE_PUBLIC_URL`

### 3.2 不要默认使用 backend service 的 `DATABASE_URL`

如果 backend service 的 `DATABASE_URL` 指向：

- `postgres.railway.internal`

这对本地 Prisma 不可达。  
本地 hosted reseed 要用的是：

- `Postgres.DATABASE_PUBLIC_URL`

### 3.3 取 `DATABASE_PUBLIC_URL` 并组装本地 `DATABASE_URL`

人工从 `railway variable list -s Postgres --json` 读取 `DATABASE_PUBLIC_URL`，然后导出：

```bash
export DATABASE_URL='postgresql://<public-host>:<port>/<db>?schema=public'
```

安全要求：

- 不要把完整连接串写进仓库文档
- 结果记录里只记“已从 Postgres service 读取 public URL”

### 3.4 执行 reseed

在仓库根目录执行：

```bash
npm run seed:demo
```

通过标准：

- 命令退出码为 `0`
- 没有 `postgres.railway.internal` 连接错误
- 没有 Prisma schema / auth 失败

默认不要把下面这种方式当主路径：

```bash
railway run npm run seed:demo
```

除非已经确认 Railway 当前执行模型会注入一个本地可达的数据库 host。

### 3.5 reseed 后的最低数据预期

reseed 成功后，至少应恢复出以下 contract：

- published conferences: `3`
- published grants: `2`
- clean applicant `demo.applicant@asiamath.org`: `0` applications
- showcase applicant `demo.showcase.applicant@asiamath.org`: `4` applications
- showcase grant `Number Theory Collaboration Travel Support 2026`: `post_visit_report_status = submitted`

---

## 4. Vercel preview 侧检查与必要重部署步骤

### 4.1 先确认你看的就是最新 preview

在 `asiamath-demo-d0-frontend-preview` 中：

1. 找到最新 preview deployment
2. 记录 deployment 时间、commit SHA、branch
3. 复制实际 preview URL 到 `FRONTEND_PREVIEW_URL`

若 branch 不是：

- `codex/demo-d0-postgres-deploy`

则按“部署来源问题”处理，不要先把行为解释成 seed 问题。

### 4.2 检查 preview build 配置

只读确认：

- `VITE_API_BASE_URL` 指向当前 Railway backend public URL 的 `/api/v1`

如果没设、设成旧 backend 域名、或误指向本地地址：

- 记为环境变量问题
- 不在本 runbook 内静默改配置

### 4.3 预览页面基础检查

直接打开：

- `${FRONTEND_PREVIEW_URL}/portal`
- `${FRONTEND_PREVIEW_URL}/scholars`
- `${FRONTEND_PREVIEW_URL}/login`

通过标准：

- 页面不是白屏
- 控制台没有阻塞式 runtime error
- 网络请求命中 Railway backend，而不是错误的相对路径或旧域名

### 4.4 必要时的重部署步骤

只有在以下情况才需要 redeploy：

- 最新 preview commit 正确，但 UI 仍明显滞后
- 前端静态资源疑似卡在旧 deployment
- 需要重新生成一个新的 immutable preview URL

推荐动作：

1. 在 Vercel 对“当前正确 commit 对应的 preview deployment”执行 redeploy
2. 不改 branch wiring，不改项目设置
3. redeploy 完成后，使用新的 preview URL 重跑 browser smoke

如果 branch/commit 本身就不对，redeploy 不是修复手段；那属于部署来源问题。

---

## 5. 关键 API smoke

### 5.1 Public portal-facing API smoke

```bash
curl -sS "$BACKEND_BASE_URL/api/v1/conferences" | jq '{total: .meta.total, slugs: [.data.items[].slug]}'
curl -sS "$BACKEND_BASE_URL/api/v1/grants" | jq '{total: .meta.total, slugs: [.data.items[].slug]}'
```

预期：

- conferences `meta.total = 3`
- grants `meta.total = 2`
- conference slugs 包含：
  - `integration-grant-conf-2026`
  - `regional-topology-symposium-2026`
  - `number-theory-collaboration-workshop-2026`
- grant slugs 包含：
  - `integration-grant-2026-travel-support`
  - `number-theory-collaboration-travel-support-2026`

注意：

- `applied-pde-exchange-2025` 是 seeded `closed` conference，不应出现在 public `/conferences`

### 5.2 Scholars API smoke

```bash
curl -sS "$BACKEND_BASE_URL/api/v1/scholars" | jq '{total: .meta.total, slugs: [.data.scholars[].slug]}'
curl -sS "$BACKEND_BASE_URL/api/v1/scholars/ravi-iyer" | jq '{slug: .data.scholar.slug, full_name: .data.scholar.full_name}'
```

预期：

- `meta.total` 大于等于 `3`
- public scholar slugs 至少包含：
  - `ravi-iyer`
  - `aisha-rahman`
  - `farah-iskandar`
- `GET /api/v1/scholars/ravi-iyer` 返回 `200`

### 5.3 Showcase applicant `me/applications` smoke

先登录拿 token：

```bash
export SHOWCASE_TOKEN="$(curl -sS -X POST "$BACKEND_BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$SHOWCASE_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" | jq -r '.accessToken')"
```

确认登录态：

```bash
curl -sS "$BACKEND_BASE_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $SHOWCASE_TOKEN" | jq '{email: .user.email, workspaces: .user.available_workspaces}'
```

拉取 applicant 列表：

```bash
curl -sS "$BACKEND_BASE_URL/api/v1/me/applications" \
  -H "Authorization: Bearer $SHOWCASE_TOKEN" | jq '{total: .meta.total, items: [.data.items[] | {id, source_title, viewer_status, next_action, post_visit_report_status, decision: .released_decision.display_label}]}'
```

预期：

- `meta.total = 4`
- 包含以下四条标题：
  - `Regional Topology Symposium 2026`
  - `Number Theory Collaboration Workshop 2026`
  - `Applied PDE Exchange 2025`
  - `Number Theory Collaboration Travel Support 2026`
- 至少能看出这四种状态：
  - 一个 `under_review` conference application
  - 一个 released accepted conference result
  - 一个 released rejected conference result
  - 一个 released accepted grant result，且 `post_visit_report_status = submitted`

继续验证 showcase grant detail：

```bash
export SHOWCASE_GRANT_ID="$(curl -sS "$BACKEND_BASE_URL/api/v1/me/applications" \
  -H "Authorization: Bearer $SHOWCASE_TOKEN" | \
  jq -r '.data.items[] | select(.source_title=="Number Theory Collaboration Travel Support 2026") | .id')"

curl -sS "$BACKEND_BASE_URL/api/v1/me/applications/$SHOWCASE_GRANT_ID" \
  -H "Authorization: Bearer $SHOWCASE_TOKEN" | \
  jq '{grant_title: .data.application.grant_title, result: .data.application.released_decision.display_label, report_status: .data.application.post_visit_report_status, attendance: .data.application.post_visit_report.attendance_confirmed, report_narrative: .data.application.post_visit_report.report_narrative}'
```

预期：

- `grant_title = "Number Theory Collaboration Travel Support 2026"`
- `result = "Awarded"`
- `report_status = "submitted"`
- `attendance = true`
- `report_narrative` 非空

### 5.4 Clean applicant `me/applications` smoke

```bash
export CLEAN_TOKEN="$(curl -sS -X POST "$BACKEND_BASE_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$CLEAN_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" | jq -r '.accessToken')"

curl -sS "$BACKEND_BASE_URL/api/v1/me/applications" \
  -H "Authorization: Bearer $CLEAN_TOKEN" | jq '{total: .meta.total, items: .data.items}'
```

预期：

- `meta.total = 0`
- `items = []`

---

## 6. 浏览器 smoke checklist

以下 checklist 以 `${FRONTEND_PREVIEW_URL}` 为准。

### 6.1 Public entry

- [ ] 打开 `/portal`
- [ ] 页面显示主入口 hero，而不是白屏
- [ ] 能看到 `Featured call`
- [ ] 能看到 `Opportunities`
- [ ] 能看到 scholar teaser / scholar CTA
- [ ] 没有阻塞式控制台报错

### 6.2 Login

- [ ] 从 `/login` 使用 `demo.showcase.applicant@asiamath.org / demo123456` 登录成功
- [ ] 登录后不会陷入 auth loop
- [ ] 若没有显式 `returnTo`，落到 `/dashboard` 视为当前设计行为，不按 bug 记录

### 6.3 Dashboard

- [ ] `/dashboard` 能正常加载
- [ ] 页面有 `Dashboard` heading
- [ ] 页面有稳定的 `Back to portal` 出口
- [ ] 页面有 `Account` affordance
- [ ] `My Applications` 区块不是错误态

### 6.4 Applications

- [ ] 打开 `/me/applications`
- [ ] showcase applicant 能看到 `4` 条记录
- [ ] 列表中包含：
  - `Regional Topology Symposium 2026`
  - `Number Theory Collaboration Workshop 2026`
  - `Applied PDE Exchange 2025`
  - `Number Theory Collaboration Travel Support 2026`
- [ ] released 结果记录可进入 detail

### 6.5 Grant detail

- [ ] 打开 `Number Theory Collaboration Travel Support 2026` 的 applicant detail
- [ ] 页面显示 `Awarded`
- [ ] 页面显示 `Post-visit report`
- [ ] 页面显示 `Status: submitted`
- [ ] 页面显示 `Attendance: Confirmed`
- [ ] narrative 文本非空
- [ ] 返回 `/me/applications` 的链路正常

### 6.6 Scholar listing

- [ ] 打开 `/scholars`
- [ ] 页面显示 `Scholar directory`
- [ ] 页面显示 research clusters / public scholar profiles 两个区块
- [ ] scholar list 非空
- [ ] 至少打开一位 public scholar，推荐验证 `/scholars/ravi-iyer`
- [ ] 如果从 `/portal` 进入 scholar 目录，`Back to portal` 返回链应正常

### 6.7 Clean applicant empty state

- [ ] 登出 showcase applicant
- [ ] 使用 `demo.applicant@asiamath.org / demo123456` 登录
- [ ] 打开 `/me/applications`
- [ ] 页面保持 empty state，没有泄漏 seeded records
- [ ] 仍能看到浏览 conferences / start CTA

---

## 7. 结果记录模板

每次 runbook 回放都至少记录一次 summary 和一张 check log。

### 7.1 Summary template

```md
## Hosted Smoke Run - <YYYY-MM-DD HH:mm TZ>

- Operator:
- Source branch assumed live:
- Railway project/service:
- Vercel preview URL:
- Backend base URL:
- Reseed performed: Yes / No
- Result: Pass / Fail / Partial
- Blocking issue summary:
```

### 7.2 Check log template

| Check | Pass/Fail | URL / Command | Timestamp | Screenshot | Notes / Exception |
|---|---|---|---|---|---|
| Railway link + service check |  |  |  |  |  |
| Railway reseed |  |  |  |  |  |
| Public conferences API |  |  |  |  |  |
| Public grants API |  |  |  |  |  |
| Scholars API |  |  |  |  |  |
| Showcase `/me/applications` API |  |  |  |  |  |
| Clean `/me/applications` API |  |  |  |  |  |
| `/portal` browser smoke |  |  |  |  |  |
| `/dashboard` browser smoke |  |  |  |  |  |
| `/me/applications` browser smoke |  |  |  |  |  |
| Grant detail browser smoke |  |  |  |  |  |
| `/scholars` browser smoke |  |  |  |  |  |

截图建议至少保留：

- `/portal`
- showcase applicant `/me/applications`
- showcase grant detail
- clean applicant `/me/applications`

---

## 8. 失败分流

| 类别 | 典型症状 | 优先判断 | 下一步 |
|---|---|---|---|
| 数据问题 | counts 不对、showcase 少记录、grant 缺 post-visit report、clean applicant 不是空态 | reseed 是否真的打到了 `Postgres.DATABASE_PUBLIC_URL`；是否命中了错项目/错数据库 | 重新取 `DATABASE_PUBLIC_URL`，重跑 `npm run seed:demo`，再跑 API smoke |
| 环境变量问题 | frontend 调错域名、preview 打 `/api/v1` 相对路径、auth/me 401/404、页面加载但数据全空 | `VITE_API_BASE_URL` 是否指向当前 Railway backend；backend public URL 是否变化 | 记录为 env drift；不要在本 runbook 内静默改 hosted 配置 |
| 分支 / 部署来源问题 | preview URL 看起来没更新、Vercel branch/commit 不是预期、backend/frontend 对不上同一候选版本 | 是否打开了最新 immutable preview URL；branch 是否仍应是 `codex/demo-d0-postgres-deploy` | 打开最新 preview；若 commit 错，交还 deployment owner 处理来源同步 |
| 浏览器问题 | 只在单个浏览器复现、页面卡旧 bundle、登录态异常、截图与 API 结果不一致 | 是否存在缓存、cookie、service worker、扩展干扰 | hard refresh、无痕窗口、清理站点数据、换浏览器后复测 |

---

## 9. 完成标准

只有当以下条件同时成立，才算本次 hosted preview 已恢复到 demo-ready：

1. Railway reseed 成功，且没有 `postgres.railway.internal` 误连问题。
2. public conferences / grants / scholars API 结果符合当前 seed contract。
3. showcase applicant 与 clean applicant 的 `/me/applications` 行为都符合预期。
4. browser smoke 中的 `/portal`、`/dashboard`、`/me/applications`、grant detail、`/scholars` 全部可讲述。
5. 结果记录模板已填写，且附带时间戳、URL、截图与异常说明。

如果只通过了 API smoke，但 browser smoke 失败，本次结果只能记为：

- `Partial`

