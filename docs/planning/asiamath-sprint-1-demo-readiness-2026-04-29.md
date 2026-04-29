# Asiamath Sprint 1: Demo Readiness

> Updated: 2026-04-29  
> Baseline branch: `codex/demo-d0-postgres-deploy`  
> Sprint type: post-MVP closeout sprint  
> Goal: 让当前 Asiamath 从 “功能型 MVP 已完成” 进入 “可重复展示、可重复验收、可交接” 的 demo-ready 状态。

> Current status: `completed`
> Closeout record: `docs/planning/asiamath-sprint-1-closeout-2026-04-29.md`

---

## 1. Sprint 目标

本轮 sprint 不新增大范围产品功能。  
本轮只做一件事：

> 把当前已完成的 MVP 故事线收口成一个稳定、可彩排、可部署、可交接的 `d0` demo baseline。

这意味着：

- 优先解决演示阻塞项
- 优先解决环境不一致
- 优先解决 preview / reseed / smoke 的重复性问题
- 优先把 must-pass path 做到无需口头补救

---

## 2. 基线与范围

### 2.1 基线

当前 sprint 的默认基线为：

- branch: `codex/demo-d0-postgres-deploy`

当前 sprint 的默认参考文档为：

- `docs/planning/asiamath-demo-coverage-matrix-d0.md`
- `docs/planning/asiamath-demo-preview-ops-d0.md`
- `docs/planning/asiamath-demo-manual-test-checkpoints-d0.md`
- `docs/planning/asiamath-mvp-status-inventory-2026-04-29.md`
- `docs/planning/asiamath-post-mvp-backlog-v1.md`

### 2.2 Must-pass path

本轮必须优先保证这条主讲路径：

1. `Portal` entry
2. `Conference` discovery
3. `Conference` detail
4. `Login / auth handoff`
5. `My applications`
6. Applicant-visible application detail or released result

### 2.3 扩展验收面

在主讲路径之外，本轮还要补以下角色或支撑面：

- grant result + post-visit report
- public scholar directory / portal scholar teaser
- reviewer workspace entry / queue / detail
- organizer workspace entry / queue / detail
- hosted preview reseed + smoke

---

## 3. 本轮任务

| ID | 任务 | 原因 | 产出 |
|---|---|---|---|
| `DR-001` | 确认并冻结 `d0` 演示基线 | 没有稳定基线，后续验收和 polish 会失焦。 | branch / preview / seed contract 的单点说明。 |
| `DR-002` | 收口本地运行口径 | 端口与 API base 差异会制造假 bug。 | 统一的本地启动说明、默认端口约定或脚本封装。 |
| `DR-003` | 收口 Postgres dev/test 契约 | test DB 可达性已实际影响验证。 | 可重复的 dev/test DB 说明、reset 命令、失败排查入口。 |
| `DR-004` | 执行一次完整人工 rehearsal | 当前主链是“多次局部通过”，需要一次合并口径后的整体验收。 | 统一 issue list，标出 P0 / P1 demo blockers。 |
| `DR-005` | 执行 hosted preview reseed + smoke | 外部演示最怕链接能打开但数据或环境错位。 | Railway / Vercel preview 恢复步骤与 smoke 结果。 |
| `DR-006` | 修复本轮暴露的 P0 demo blockers | 只要阻塞演示，就优先于新功能。 | 小范围 bugfix merge，不开新功能支线。 |
| `DR-007` | 准备 presenter-safe demo kit | 让 demo 不依赖“只有某个人知道怎么讲”。 | 账号、路径、讲解顺序、预期画面、回退方案。 |

---

## 4. 本轮不做什么

本轮明确不做：

1. 新开一轮大 feature 实现
2. 把 breadth 页面全部改成真实后端
3. 大规模 UI 重设计
4. 无明确阻塞证据的系统性重构
5. 与当前 demo 无关的深层 product expansion

---

## 5. 验收标准

本轮 sprint 结束时，至少应满足以下标准。

### 5.1 路径与页面

- `must-pass path` 全程可顺畅点击，不出现 dead-end CTA
- applicant 主链上的页面在目标环境中没有阻塞式 runtime error
- grant released result 与 post-visit report 状态正确
- scholar directory 与 portal scholar teaser 展示真实公开 profile 数据
- reviewer / organizer 关键 workspace 页面具备稳定 header、主返回、portal 出口与 account affordance

### 5.2 数据与账号

- showcase 账号和 clean 账号行为符合预期
- 演示数据在 reseed 后能恢复到预期状态
- 关键页面的示例数据足够支撑 3 分钟与 10 分钟讲解

### 5.3 环境与运营

- 本地演示环境可以按固定说明启动
- hosted preview 能按 runbook 恢复并 smoke-check
- 预览 URL、seed 方式、环境变量差异不再依赖口头记忆

### 5.4 交接与叙事

- 有一份固定的 demo script
- 有一份 rehearsal 发现问题及处理结论
- 有清楚的“哪些是真实功能、哪些是 preview breadth”说明

---

## 6. 建议的 manual-test 清单

### 6.1 Applicant must-pass

1. 打开 `/portal`
2. 进入 `/conferences`
3. 打开 conference detail
4. 触发登录或进入 applicant workspace
5. 查看 `/me/applications`
6. 打开 released result detail
7. 对 accepted grant 检查 post-visit report 状态

### 6.2 Role workspace checks

1. applicant / reviewer 双 workspace 账号登录
2. 检查 workspace switcher 是否稳定
3. reviewer queue -> detail -> back
4. organizer queue -> detail -> back
5. 检查 `Back to portal` 与 `Account` affordance

### 6.3 Hosted preview checks

1. 执行 reseed
2. 检查 public conferences / grants API
3. 检查 showcase applicant `/me/applications`
4. 检查 clean applicant `/me/applications`
5. 用浏览器复走一次 must-pass path

---

## 7. 退出门槛

Sprint 1 只有在以下条件同时满足时，才算真正完成：

1. `d0` 基线明确
2. 主讲路径已 rehearsal
3. hosted preview 已 smoke
4. 没有已知 P0 demo blocker
5. demo kit 已准备好

若任一条件未满足，则本轮仍应视为 `in progress`，而不是“因为功能已完成所以自然结束”。

Current closeout result:

- `DR-001 ~ DR-007` 已全部有对应 artifact 或执行结果
- local rehearsal 已在修后复跑中转为 `Pass`
- hosted preview reseed + smoke 已转为 `Pass`
- 当前已无已知 `P0` demo blocker
- 因此本 sprint 现在按 closeout 记录视为 `completed`

---

## 8. Sprint 1 之后的衔接

如果 Sprint 1 完成，下一轮优先有两种选择：

### 路线 A: 继续 Demo / Delivery

适用于近期仍要频繁给需求方或领导展示：

- 强化 preview 流程
- 提升 mobile / polish
- 增加可信示例数据
- 稳定 rehearsal 节奏

### 路线 B: 回到真实功能增长

适用于 demo 已稳定、准备进入下一轮产品化：

- scholar directory 搜索 / filter
- reviewer access 流程
- backend runtime / deployment 深化
- 选定 1-2 个 breadth 模块继续 productize
