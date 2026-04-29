# Asiamath Demo Kit d0

> Updated: 2026-04-29  
> Scope: `DR-007` / `PMB-007` presenter-safe walkthrough for the frozen `d0` baseline  
> Stable baseline: `codex/demo-d0-postgres-deploy`  
> Intended use: 让不是当前开发者本人也能按固定脚本完成一次稳定 demo

---

## 1. 演示定位

### 1.1 可以按“真实能力”讲的部分

以下能力可以按当前 `d0` 基线上的真实闭环或真实对齐能力来讲：

- auth / login / session
- `/portal` 作为公共入口
- `/conferences`、conference detail、conference/grant opportunity discovery
- applicant `/me/applications`、application detail、released result
- accepted grant 的 post-visit report 已提交状态展示
- public scholar detail 与 portal scholar teaser 的真实公开 profile 叙事
- reviewer / organizer workspace 的 sample touchpoints

### 1.2 必须明确标成 demo / preview 宽度的部分

以下部分的任务是补足产品形状，不应讲成“已经 fully productized”：

- `Schools / Prizes / Partners` 等 `hybrid` breadth 页面
- `Newsletter / Videos / Governance / Publications / Outreach` 等 `static-preview` 页面
- hosted preview 的 reseed / smoke 仍然依赖 runbook，不是零运维自愈环境
- presenter-safe seed 数据本身是为演示可重复性而设计，不是自然生产数据分布

### 1.3 安全口径

推荐讲法：

- “核心 applicant story 已经是可走通的真实链路。”
- “breadth 页面主要用于展示平台覆盖面和产品形状。”
- “reviewer / organizer 已有可演示 touchpoint，但当前 demo 不把它讲成完整运营套件。”

不要讲：

- “所有模块都已经是生产完成态。”
- “preview 环境已经一键恢复、不会漂移。”
- “这次 demo 覆盖的每个页面都已经接入真实后端。”

---

## 2. 基线与演示前提

### 2.1 基线规则

- 当前稳定代码基线与当前 hosted `d0` preview 来源都视为 `codex/demo-d0-postgres-deploy`
- 如果使用 hosted preview，必须打开最新的 preview URL，不要复用旧 URL
- 如果 hosted preview 有漂移嫌疑，先按 `asiamath-demo-preview-ops-d0.md` 做 reseed + smoke，再开始对外演示
- 如果切本地 acceptance fallback，使用：
  - frontend: `http://127.0.0.1:5175`
  - backend: `http://127.0.0.1:3001`
  - `VITE_API_BASE_URL=http://127.0.0.1:3001/api/v1`

### 2.2 演示前必须确认的 seed 状态

公共机会页应满足：

- public `/conferences` 可见 `3` 个 `published` conference：
  - `Integration Grant Conference 2026`
  - `Regional Topology Symposium 2026`
  - `Number Theory Collaboration Workshop 2026`
- public `/grants` 可见 `2` 个 `published` grant：
  - `Integration Grant 2026 Travel Support`
  - `Number Theory Collaboration Travel Support 2026`

账号状态应满足：

- `demo.applicant@asiamath.org` 登录后 `/me/applications` 为 `0` 条
- `demo.showcase.applicant@asiamath.org` 登录后 `/me/applications` 为 `4` 条，且能支撑：
  - `Regional Topology Symposium 2026`: under review
  - `Number Theory Collaboration Workshop 2026`: released accepted conference result
  - `Applied PDE Exchange 2025`: released rejected conference result
  - `Number Theory Collaboration Travel Support 2026`: released accepted grant result with submitted post-visit report

### 2.3 待补的现场字段

这些字段建议在正式 handoff 前补全：

- `Hosted preview URL`: `[TBD fill current Vercel preview URL]`
- `Current shared demo password`: `demo123456`（来自当前 `backend/src/lib/demoBaseline.ts`，正式对外演示前仍应现场复核）
- `Last successful reseed + smoke`: `[TBD timestamp + operator]`
- `Reviewer sample queue item`: `[TBD confirm after latest smoke]`
- `Organizer sample queue item`: `[TBD confirm after latest smoke]`

---

## 3. 固定 demo 账号 / 角色 / 用途

| Account key | Email | Role | 用途 | 预期状态 |
|---|---|---|---|---|
| `applicant` | `demo.applicant@asiamath.org` | applicant | clean path、空态说明、从零申请起点 | `/me/applications = 0` |
| `showcaseApplicant` | `demo.showcase.applicant@asiamath.org` | applicant | 主讲账号，稳定展示 workflow outcome | `/me/applications = 4` |
| `reviewer` | `demo.reviewer@asiamath.org` | reviewer | reviewer workspace entry / queue / detail sample | 作为 role-touchpoint 使用，不承担主讲主链 |
| `organizer` | `demo.organizer@asiamath.org` | organizer | organizer workspace entry / queue / detail sample | 作为 role-touchpoint 使用，不承担主讲主链 |

使用原则：

- 当前 seeded demo 账号默认共享密码为 `demo123456`；若现场登录失败，应按 credential drift 处理，而不是先假设产品主链失效。
- `3` 分钟版本默认只用 public surface + `showcaseApplicant`
- `10` 分钟版本可额外用 `applicant`、`reviewer`、`organizer`
- 除专门 rehearsal 外，不在正式 demo 中执行真实提交动作来“现场制造数据”

---

## 4. 3 分钟版本讲解顺序

目标：只讲最稳的主链，不做 live submission。

| 时间 | 页面 / 动作 | 要说的话 |
|---|---|---|
| `0:00-0:30` | 打开 `/portal` | “这是 Asiamath 的公共入口。当前 demo 先从真实主链开始，breadth 页后面只做辅助展示。” |
| `0:30-1:00` | 进入 `/conferences` | “机会发现页已经能稳定承载真实机会列表；这里先看 conference 主链。” |
| `1:00-1:20` | 打开任一主讲 conference detail，优先 `Regional Topology Symposium 2026` 或 `Number Theory Collaboration Workshop 2026` | “详情页承接公开机会叙事，后续 applicant 登录后会看到同一产品里的个人申请结果。” |
| `1:20-1:40` | 登录 `showcaseApplicant`，登录后直接去 `/me/applications` | “为了避免现场造数据，我切到预置的 showcase applicant，直接看完整 workflow outcome。” |
| `1:40-2:30` | 在 `/me/applications` 逐行点名 `under review / accepted / rejected / accepted grant with report submitted` 四种状态 | “这不是单一 happy path，而是把申请进行中、结果释放、通过/未通过、grant follow-up 几个关键状态都固定成可重复演示的数据。” |
| `2:30-3:00` | 打开 `Number Theory Collaboration Travel Support 2026` 的 detail / result | “这里能看到 released accepted grant result，以及 post-visit report 已提交状态。核心故事到这里闭环，剩下的 breadth 页面我会明确标成 preview coverage。” |

---

## 5. 10 分钟版本讲解顺序

目标：在不冒现场写数据风险的前提下，把主链、角色面和 breadth 边界一起讲清楚。

| 时间 | 页面 / 动作 | 要说的话 |
|---|---|---|
| `0:00-1:00` | `/portal` | “这是平台入口。今天先分清两件事：哪些是当前真实主链，哪些是为 demo 宽度准备的 preview surface。” |
| `1:00-2:00` | `/conferences` -> conference detail | “conference discovery 和 detail 是 must-pass path 的一部分，是真正要稳定讲通的主线。” |
| `2:00-2:40` | `/grants` 或 grant detail 快速带过 | “grant opportunity 与 conference 主链并列存在，但今天不现场提交，只展示可达与后续 applicant 结果面。” |
| `2:40-3:30` | 登录 `demo.applicant@asiamath.org`，打开 `/me/applications` 空态 | “这个 clean applicant 账号保持零申请，专门用来说明系统既能从空态开始，也不需要靠脏数据撑场。” |
| `3:30-5:30` | 切换到 `showcaseApplicant`，打开 `/me/applications` | “同一个产品里，再切到 showcase applicant，就能直接看到 under review、accepted、rejected、grant follow-up 这些结果态。” |
| `5:30-6:30` | 打开 accepted grant result detail | “这里是最完整的 applicant result surface：released result 可见、grant follow-up 状态已提交。” |
| `6:30-7:20` | 如需要，打开 public scholar detail 或从 portal scholar teaser 说明 | “scholar surface 用来支撑真实 profile 叙事和平台可信度，不只是静态文案页。” |
| `7:20-8:20` | 登录 reviewer 账号，展示 reviewer workspace entry / queue / detail sample | “reviewer 已有可演示 touchpoint，但今天只把它讲成 sample workflow，不展开成完整运营套件。” |
| `8:20-9:20` | 登录 organizer 账号，展示 organizer workspace entry / queue / detail sample | “organizer 也是同样口径：可展示工作台骨架与关键触点，但不是这次 demo 的主讲链。” |
| `9:20-10:00` | 选 `Schools / Prizes / Partners` 中一个 hybrid 页，或 `Newsletter / Videos` 中一个 static-preview 页收尾 | “这些页面的任务是展示平台覆盖面。它们不是这次要过度承诺成 fully live module 的部分。” |

---

## 6. 关键页面与每页要说的话

| 页面 / Surface | Page mode | 建议说法 |
|---|---|---|
| `/portal` | `hybrid` | “入口页负责把公共机会、scholar context 和平台 breadth 串起来。” |
| `/conferences` | `real-aligned` | “这里是当前最值得信任的公开机会发现面之一。” |
| conference detail | `real-aligned` | “机会详情页承接公开叙事，登录后再切到 applicant 结果面。” |
| `/grants` | `real-aligned` | “grant 是与 conference 并列的机会面，不需要靠假内容才能讲。” |
| `/me/applications` clean applicant | `real-aligned + hybrid shell` | “空态说明系统可以从零开始，不需要先塞假记录。” |
| `/me/applications` showcase applicant | `real-aligned + hybrid shell` | “showcase 账号是 presenter-safe 数据包，用来稳定展示多个 workflow 状态。” |
| accepted grant result detail | `real-aligned + hybrid shell` | “这是 applicant 主链的完整结果面，包括 released result 与 post-visit report 已提交。” |
| public scholar detail | `hybrid` with real public profile data | “profile 不是孤立的表单页，公共 scholar surface 和个人资料叙事是连起来的。” |
| reviewer workspace entry / queue / detail | `real + shell hardening` | “reviewer 已有 sample touchpoint，可说明平台不只面向 applicant。” |
| organizer workspace entry / queue / detail | `real + shell hardening` | “organizer 也已有可演示工作台骨架，但今天不把它讲成完整后台套件。” |
| `Schools / Prizes / Partners` | `hybrid` | “这是当前 demo 宽度的一部分，用于展示平台横向覆盖面。” |
| `Newsletter / Videos / Governance / Publications / Outreach` | `static-preview` | “这些是产品形状页，不按 fully live module 来承诺。” |

---

## 7. Fallback 路径

| 出现问题 | 立刻切到哪里 | 现场讲法 |
|---|---|---|
| `/portal` 入口异常或内容看起来 stale | 直接从 `/conferences` 开始 | “公共入口不是今天的风险主线，我直接从 must-pass opportunity story 开始。” |
| conference detail 打不开 | 留在 `/conferences` 并切到另一个 published conference | “公开发现面本身已经能说明机会存在，detail 我切到另一个稳定记录继续。” |
| 登录后跳转不稳定 | 登录后手动打开 `/me/applications` | “auth handoff 已完成，我直接进入 applicant workspace 结果面。” |
| `showcaseApplicant` 不是 4 条记录 | 切回 clean applicant 空态 + public surfaces | “当前 preview 需要 reseed 才能恢复 workflow showcase；我先用 clean applicant 和公开机会面讲真实主链。” |
| accepted grant detail 缺少已提交 report 状态 | 打开 accepted conference result 或 rejected record | “结果释放面仍可讲；grant follow-up 是当前 seed baseline 的一部分，但这个 preview 需要重新 reseed。” |
| reviewer / organizer 入口不稳定 | 不再切角色，停留 applicant story | “角色工作台今天只作为扩展触点；主线仍是 applicant must-pass path。” |
| public `/conferences` 里没有 `Applied PDE Exchange 2025` | 不修、不解释成 bug | “这是预期行为。closed conference 只用于 applicant result realism，不在 public list 展示。” |
| push 后页面没变化 | 关闭旧链接，换最新 preview URL | “Vercel preview URL 是 immutable 的，先确认我们打开的是最新部署。” |

---

## 8. Operator Notes

- 演示前优先用无痕窗口或干净浏览器 profile，减少上次登录态和 workspace 记忆干扰。
- 建议提前准备 `4` 个标签页：
  - public `/portal` 或 `/conferences`
  - `showcaseApplicant` 的 `/me/applications`
  - reviewer workspace entry
  - organizer workspace entry
- reviewer / organizer 不是主讲主链，时间紧时可以完全不打开。
- 登录后如果 landing 不如预期，不要现场研究 redirect；直接手动打开目标页。
- 尽量不要在正式 demo 中点击会写数据的按钮，包括：
  - `Apply`
  - `Submit application`
  - `Submit post-visit report`
  - 任何可能改变 application 状态的操作
- 不要把 `static-preview` 页面讲成“已经全部接真实后端”。
- 不要把 `/conferences` 缺少 closed conference 讲成数据异常。
- 如果 hosted preview 刚 reseed 过但页面仍旧，先刷新到最新 preview URL，再做 hard refresh。

---

## 9. 不要过度承诺的边界说明

- 当前 `d0` 最可信的是 applicant 主故事线，不是“全站所有模块都完成产品化”。
- breadth 页面当前主要解决“平台看起来是什么”，不是“每条内容流都已经 fully live”。
- reviewer / organizer 已具备 sample touchpoint，但不应在这次 demo 里承诺成深度运营后台。
- hosted preview 的可恢复性来自 runbook，不来自自动化零维护。
- seed 数据是为 presenter-safe 而设计；它的价值是稳定讲述，不是模拟自然生产分布。

---

## 10. 推荐收尾句

如果只留一句收尾，建议用：

> “当前 d0 已经能稳定讲清 applicant 主链，并用受控的 breadth 与角色 touchpoint 展示平台形状；我们刻意把 preview 宽度和真实主链分开讲，避免把还在收口中的部分过度承诺成 fully released product.”
