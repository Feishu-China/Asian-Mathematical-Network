# Asiamath Post-MVP Backlog v1

> Updated: 2026-04-29  
> Baseline branch: `codex/demo-d0-postgres-deploy`  
> Purpose: 把 Asiamath 从 “MVP 功能已完成” 切换到 “收口、演示、稳定化、下一轮迭代” 的 backlog 视角。

---

## 1. 使用方式

本 backlog 不再按旧的 `FE-* / BE-* / INT-*` feature list 组织，而按 post-MVP 阶段更有用的四类工作组织：

- `Bug / Stability`
- `Core Usability`
- `Demo Readiness`
- `Engineering / Delivery`

每个任务再额外标三种影响标签：

- `Demo impact`
- `Real-use impact`
- `Unblock impact`

优先级定义：

- `P0 Now`: 当前 1 个 sprint 内优先处理
- `P1 Next`: 下一轮 sprint 再接
- `P2 Later`: 明确有价值，但不应现在抢占主线

---

## 2. P0 Now

| ID | 标题 | 分类 | 影响标签 | 为什么现在做 | 完成标准 |
|---|---|---|---|---|---|
| `PMB-001` | 冻结并声明 `d0` 稳定基线 | Demo Readiness | `demo`, `unblock` | 当前最新可讲述基线已经转移到 `codex/demo-d0-postgres-deploy`，需要把“演示基线是谁”写清楚。 | 明确 stable branch、preview 对应关系、谁能往里并、何时 rereseed。 |
| `PMB-002` | 收口本地 frontend/backend 端口与 API base 口径 | Bug / Stability | `demo`, `real-use`, `unblock` | `3000/3001` 差异会让手测、联调、demo rehearsal 反复出现假问题。 | 本地默认启动说明与脚本统一，手测不再需要口头解释端口例外。 |
| `PMB-003` | 收口 Postgres dev/test 运行契约 | Engineering / Delivery | `real-use`, `unblock` | `5432/5433`、test DB 是否启动，已经多次影响验证节奏。 | 明确 dev/test DB 约定、reset 命令、失败排查入口；关键测试库可重复启动。 |
| `PMB-004` | 完成一次完整 `d0-story` + role workspace 验收 | Demo Readiness | `demo`, `real-use` | 当前主链虽然多次局部验证，但还需要一次合并口径后的 rehearsal。 | applicant、reviewer、organizer 关键链路按同一 checklist 走通，并记录问题清单。 |
| `PMB-005` | 完成 hosted preview reseed + smoke runbook 回放 | Demo Readiness | `demo`, `unblock` | 预览环境是否可重复恢复，是需求方演示前最重要的运营问题。 | Railway/Vercel preview 可按 runbook 恢复到展示状态，关键 API 与前端 smoke 通过。 |
| `PMB-006` | 整理 feature-list `passes` 遗留约定 | Engineering / Delivery | `unblock` | 当前 `24/24 completed` 但仍有 `8` 个 `passes: false`，会让交接口径不够直观。 | 明确是否保留现状、统一回填、或新增文档说明，不再造成误判。 |
| `PMB-007` | 准备 presenter-safe demo kit | Demo Readiness | `demo` | 现在系统已经能演示，但缺一个可重复、可交给别人上手的演示包。 | 固定 demo 账号、seed 数据、3 分钟 / 10 分钟脚本、关键截图或讲解顺序。 |

---

## 3. P1 Next

| ID | 标题 | 分类 | 影响标签 | 为什么放下一轮 | 完成标准 |
|---|---|---|---|---|---|
| `PMB-008` | Scholar directory 搜索 / filter / pagination | Core Usability | `real-use`, `demo` | 当前 real-data 已打通，但目录仍是最小可用形态。 | scholar directory 支持基础筛选或检索，仍保持公开 profile contract 清晰。 |
| `PMB-009` | Reviewer access 申请 / 开通流程 | Core Usability | `real-use` | 当前 reviewer 权限仍依赖管理员直接开通；这不是阻塞 demo 的第一优先级。 | 有明确的 reviewer enablement 流程，不再依赖手工数据库或临时管理动作。 |
| `PMB-010` | Dashboard / workspace 文案和状态语义统一 | Bug / Stability | `demo`, `real-use` | `active applications` 之类问题说明壳层文案还需系统性收口。 | applicant/reviewer/organizer 关键空态、结果态、入口文案统一且可预测。 |
| `PMB-011` | Backend runtime 与 deployment shape 再硬化 | Engineering / Delivery | `unblock`, `real-use` | 目前 PostgreSQL deployment 已可用，但仍有 `ts-node` / local wrapper / env 差异需要整理。 | backend 生产运行方式、migrate、health-check、env templates 清晰固定。 |
| `PMB-012` | 二级页面移动端与布局 polish | Demo Readiness | `demo` | 当前不是主风险，但在正式展示或外部试用前会影响观感。 | 关键二级页在移动端和窄屏下没有明显布局断裂。 |

---

## 4. P2 Later

| ID | 标题 | 分类 | 影响标签 | 为什么后放 | 完成标准 |
|---|---|---|---|---|---|
| `PMB-013` | ORCID / 学术身份可信度增强 | Core Usability | `real-use`, `demo` | 有价值，但当前并不阻塞 MVP 收口或 demo 可讲述性。 | scholar profile 的 academic identity 信息更完整、可验证、可展示。 |
| `PMB-014` | breadth 页面从 preview 向真实内容逐步迁移 | Core Usability | `demo`, `real-use` | 这些页面当前的使命是“补足产品形状”，不应抢主线。 | 选定 1-2 个最值得 productize 的 breadth 模块，逐步转为真实内容流。 |
| `PMB-015` | 更深的 organizer / reviewer 运营能力 | Core Usability | `real-use` | 当前 MVP 已经有 workflow touchpoints；是否深化应由后续产品节奏决定。 | 只有在有明确产品优先级时才继续扩展更深工作流。 |
| `PMB-016` | 大规模前端结构重构 | Engineering / Delivery | `unblock` | 当前尚未出现必须马上大改架构才能继续的证据。 | 仅在持续迭代明确受阻时，再单独立项重构。 |

---

## 5. 当前不建议立即做的事

下面这些事不是“永远不做”，而是 **现在做会打散节奏**：

1. 再开一轮新的大 feature list
2. 把 breadth 页面一口气全部 productize
3. 为了追求“整洁”立刻做大重构
4. 同时推进 demo polish、真实功能扩展、infra 改造三条大线
5. 让 demo 线长期偏离真实 contract

---

## 6. 推荐执行顺序

如果只保留最小 next-step 顺序，建议如下：

1. `PMB-001` 冻结 demo 基线
2. `PMB-002` + `PMB-003` 收环境与测试口径
3. `PMB-004` + `PMB-005` 完整 rehearsal 与 hosted smoke
4. `PMB-007` 出 demo kit
5. 然后才决定是先接 `PMB-008~PMB-012`，还是直接开下一轮功能 sprint

---

## 7. 与现有文档的关系

本 backlog 应与以下文档配套使用：

- `docs/planning/asiamath-mvp-status-inventory-2026-04-29.md`
- `docs/planning/asiamath-sprint-1-demo-readiness-2026-04-29.md`
- `docs/planning/asiamath-demo-coverage-matrix-d0.md`
- `docs/planning/asiamath-demo-preview-ops-d0.md`
- `docs/planning/mvp-demo-dual-track-governance.md`

