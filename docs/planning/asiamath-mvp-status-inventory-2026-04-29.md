# Asiamath MVP 状态盘点

> Updated: 2026-04-29  
> Scope: 在当前 `codex/demo-d0-postgres-deploy` 基线上，对 “MVP 是否已完成” 做一次面向执行的盘点。  
> This file is not a new feature list. It is a decision-support inventory for post-MVP planning.

---

## 1. 结论先行

当前结论可以明确写成三句话：

1. 按 `docs/planning/asiamath-feature-list-v4.0-optimized.json` 的口径，当前 `24/24` 个 feature 均已 `completed`。
2. 当前系统已经达到“功能型 MVP 完成”的状态，但尚未达到“发布 / 演示 / 持续迭代完全收口”的状态。
3. 下一阶段不应继续沿旧 feature list 扩写，而应切换到 `post-MVP` 的收口、验收、部署与节奏化迭代。

补充说明：

- feature list 中仍有 `8` 个 `FE-*` / `BE-*` implementation feature 保持 `passes: false`。这不再表示“功能没做”，而更像是当前文档约定下“implementation 项不单独以 E2E 视角回填 passes=true”的遗留状态。
- `INT-*` 集成项已经完成到当前 MVP 口径，包括：
  - `INT-AUTH-001`
  - `INT-PROFILE-001`
  - `INT-PROFILE-002`
  - `INT-CONF-001`
  - `INT-GRANT-001`
  - `INT-REVIEW-001`
  - `INT-PORTAL-001`

---

## 2. MVP 完成判定

### 2.1 当前判定

| 判定项 | 当前状态 | 说明 |
|---|---|---|
| 核心用户路径是否走通 | `Pass` | `portal -> conferences/grants -> apply -> my applications -> result` 已有真实联调与本地验收证据。 |
| 是否存在阻塞演示的已知 P0 缺口 | `No known P0 feature gap` | 当前剩余问题更像环境口径、验收重复性、部署与演示运营问题。 |
| 是否满足需求方最关心的展示点 | `Mostly yes` | Public portal、opportunities、applicant workspace、grant result / post-visit report、scholar directory 已可讲述完整故事。 |
| 是否仍存在“看起来有但没真实实现”的主链功能 | `Limited` | Secondary breadth 页面仍有 `static-preview` / `hybrid` 模式，但主故事线不再依赖它们假装真实。 |
| 是否还存在大量临时 mock / 手工流程 | `Yes, but bounded` | 主要集中在 demo breadth 页面、预置数据、preview ops 和本地/托管环境切换，而不是主业务闭环。 |

### 2.2 结论

因此，`MVP 完成` 在本项目里更准确的定义是：

- **功能上**：已经达到最小可用闭环
- **工程上**：还需要进入 post-MVP 收口阶段
- **演示上**：已经具备 demo 基线，但仍需做一轮 `Demo Readiness` 才能作为稳定对外叙事版本

---

## 3. 当前状态盘点表

下表把“做完了”拆成“真实可用 / demo 可用 / 后续优先级”三个维度。

### 3.1 Core / Story surfaces

| 模块 / Surface | 当前状态 | 真实可用 | Demo 作用 | 当前数据模式 | 备注 | 后续优先级 |
|---|---|---|---|---|---|---|
| Auth / Session | 已完成 | `Yes` | 主路径必需 | `real` | 登录、注册、`getMe`、workspace 基础返回已落地。 | `P0` 稳定化 |
| Public Portal (`/portal`) | 已完成 | `Yes` | 主故事入口 | `hybrid` | 入口、featured call、opportunities、scholar teaser 已可用。 | `P0` 验收 |
| Conferences (`/conferences`, detail, apply) | 已完成 | `Yes` | 主故事核心 | `real-aligned` | conference public list/detail/apply 已有真实联调。 | `P0` 验收 |
| Grants (`/grants`, detail, apply) | 已完成 | `Yes` | 主故事核心 | `real-aligned` | linked grant apply 与 applicant result 已打通。 | `P0` 验收 |
| Applicant workspace (`/dashboard`, `/me/applications`, detail) | 已完成 | `Yes` | 主故事核心 | `real-aligned + hybrid shell` | released result、dashboard 聚合、post-visit report 已落地。 | `P0` 验收 |
| Profile edit / public scholar detail | 已完成 | `Yes` | 主故事支撑 | `hybrid` | profile update persistence 与 public detail 已接真实 API。 | `P1` 收口 |
| Scholar directory / portal scholar teaser | 已完成 | `Yes` | 支撑可信度 | `real` | `INT-PROFILE-002` 已让 `/scholars` 与 portal teaser 使用真实公开 profile 数据。 | `P1` 增强 |
| Reviewer workspace | 已完成到当前口径 | `Mostly yes` | 扩展故事 / 角色支撑 | `real + shell hardening` | review workflow 已在 feature list 口径下完成；近期又补了 navigation contract 和 applicant/reviewer switcher。 | `P1` 验收 |
| Organizer workspace | 已完成到当前口径 | `Mostly yes` | 扩展故事 / 角色支撑 | `real + shell hardening` | organizer queue/detail 已统一进 workspace shell；更深的运营体验仍适合后续收口。 | `P1` 验收 |

### 3.2 Breadth / Preview surfaces

| 模块 / Surface | 当前状态 | 真实可用 | Demo 作用 | 当前数据模式 | 备注 | 后续优先级 |
|---|---|---|---|---|---|---|
| Schools / Prizes / Partners | 已完成 | `Partial` | breadth 支撑 | `hybrid` | 页面结构完整，可支撑讲解，但不要求全部真实后端。 | `P2` |
| Newsletters / Videos / Governance / Publications / Outreach | 已完成 | `Preview only` | breadth 支撑 | `static-preview` | 用于展示产品形状，不应被误判为核心真实能力。 | `P2` |
| Demo seed / hosted preview ops | 已完成到 `d0` 口径 | `Partial` | 演示运营 | `manual + scripted` | 已有 reseed/runbook 文档，但重复性仍依赖人工执行和环境口径。 | `P0` |

---

## 4. 哪些是真功能，哪些更偏展示

### 4.1 已经可以按“真实闭环”对外表述的部分

- 用户注册、登录、鉴权
- conference discovery / detail / apply
- grant discovery / detail / apply
- applicant dashboard / application detail / released result
- accepted grant 的 post-visit report 提交与已提交展示
- public scholar detail
- public scholar directory 与 portal scholar teaser 的真实公开 profile 数据
- reviewer / organizer 的基础 workspace 入口与关键 workflow touchpoints

### 4.2 更适合按“demo breadth / product shape”对外表述的部分

- newsletter / video / governance / publications / outreach 等 `static-preview` 页面
- 部分 breadth 模块上的 fake-provider 数据
- hosted preview 的 reseed / smoke 运营流程
- 页面 mode 区分、presenter-safe walkthrough、showcase 数据样本

这些部分不是“没做”，而是它们的目标本来就更接近：

- 补足产品形状
- 提升可信展示
- 支撑需求方理解平台愿景

而不是“全部都已真实 productized”

---

## 5. 当前还不该被误判为“已经 fully released”的地方

虽然 MVP 已完成，但下面这些点仍不应被误判成“项目已经完全发布就绪”：

1. 本地运行口径仍有差异：
   - frontend dev proxy 默认仍会遇到 `3000/3001` 口径问题
   - Postgres 本地开发 / 测试端口仍出现过 `5432/5433` 差异

2. preview ops 仍有人工依赖：
   - Railway / Vercel 预览 reseed 和 smoke 仍需执行 runbook
   - 不是“一键恢复 demo 状态”

3. feature list 的 implementation 层 `passes` 仍有文档遗留：
   - 这不影响“功能存在”
   - 但会影响后续交接时对状态的直觉判断

4. reviewer / organizer 已达当前 MVP 口径，但仍更像“已可讲述 + 可验证的工作台骨架”
   - 适合继续做 targeted acceptance
   - 不适合现在就大规模扩 scope

---

## 6. 决策建议

基于本盘点，当前推荐决策如下：

### 6.1 不再继续把旧 feature list 当成下一阶段主计划

原因：

- 它解决的是“哪些功能需要被做出来”
- 它不再适合回答“如何让当前系统稳定演示、稳定部署、稳定迭代”

### 6.2 切换到 post-MVP 节奏

下一阶段的默认顺序应是：

1. `Stabilize`
2. `Acceptance`
3. `CI / Deploy`
4. `Polish`
5. 再进入下一轮功能迭代

### 6.3 当前稳定基线建议

当前更适合作为 post-MVP / demo-readiness 基线的不是抽象的 `main`，而是：

- `codex/demo-d0-postgres-deploy`

后续如果需要再做对外展示、托管 preview、或下一轮 sprint 任务拆解，应优先围绕这条基线推进。

---

## 7. 本盘点的直接产物

本次盘点之后，下一步应直接衔接三类工件：

1. `Post-MVP backlog`
2. `Sprint 1: Demo Readiness`
3. 之后每一轮 sprint 的固定验收标准与 handoff 产物

本仓库中对应文档为：

- `docs/planning/asiamath-post-mvp-backlog-v1.md`
- `docs/planning/asiamath-sprint-1-demo-readiness-2026-04-29.md`

