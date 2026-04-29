# Asiamath d0 Baseline Freeze

> Updated: 2026-04-29  
> Scope: `DR-001` / `PMB-001` short-term strategy freeze for code mainline, demo baseline, deployment source, and transition-period sync rules.  
> Non-goals: no product-scope change, no deployment-platform setting change, no runtime/config change.

## 1. Frozen Answer Set

### 当前稳定代码基线是谁

当前稳定代码基线是：

- `codex/demo-d0-postgres-deploy`

这不是抽象意义上的“旧 demo 分支”，而是当前 `d0` 可讲述、可彩排、可对照 planning 文档执行的稳定代码基线。
按 2026-04-29 的当前仓库检查，它也是当前工作分支，并且相对 `origin/main` 没有落后提交，因此适合作为待提升到 `main` 的稳定候选。

### 当前部署来源是谁

当前 hosted `d0` preview 的部署来源也继续视为：

- `codex/demo-d0-postgres-deploy`

在本策略冻结期间，不把“PR 已把它提升为 `main` 候选主线”误解成“部署已经切到 `main`”。  
如果没有显式完成 cutover，当前部署来源就仍然是这条分支。

### `main` 在 merge 后扮演什么角色

一旦候选 PR merge 完成，`main` 的短期角色应立即固定为：

- 默认代码主线
- 后续开发、评审、集成的默认落点
- 唯一的常规变更入口

但在 cutover 之前，`main` **不是自动生效的部署来源**。  
也就是说，merge 到 `main` 解决的是“代码主线是谁”，不是“当前 demo preview 立刻跟谁走”。

## 2. Transition Timeline

### 现在到 merge 前

在 PR merge 前，`codex/demo-d0-postgres-deploy` 同时承担三件事：

- 稳定代码基线
- 当前部署来源
- `main` 的候选主线

### merge 后但部署尚未切主线时

在这段过渡期里，角色拆分为：

- `main`: 代码主线
- `codex/demo-d0-postgres-deploy`: 当前部署来源与 demo release pointer

### 部署切到 `main` 之后

只有在第 4 节条件满足后，才把部署来源改成：

- `main`: 代码主线 + 部署来源

届时 `codex/demo-d0-postgres-deploy` 不再继续作为独立长期开发线存在。

## 3. 过渡期同步规则

如果部署暂时不切到 `main`，短期内必须按以下规则执行，避免部署分支与主线漂移。

### 3.1 `main` 是 merge 后唯一常规开发入口

PR merge 后，正常开发不再直接落到 `codex/demo-d0-postgres-deploy`。  
新功能、小修复、文档调整、验收修补，默认都先进入 `main`。

### 3.2 部署分支只作为受控 release pointer 前进

`codex/demo-d0-postgres-deploy` 在过渡期只允许两类变动：

1. 从 `main` 提升一个已选定的稳定提交进去，优先保持 fast-forward / 无额外分叉。
2. 为了恢复当前 demo preview 而做的紧急 blocker 修复。

除此之外，不把它当第二条日常开发分支使用。

### 3.3 任何紧急修复都必须回流 `main`

如果因为当前 preview 故障不得不先修 `codex/demo-d0-postgres-deploy`，该修复必须在下一次常规开发继续前回流到 `main`。  
目标是始终保持：

- `main` 是未来工作的真主线
- 部署分支不长期积累 `main` 没有的独有提交

### 3.4 只有“要进当前 demo preview”的变更才同步到部署分支

不是所有进了 `main` 的变更都要立刻同步到 `codex/demo-d0-postgres-deploy`。  
只有当某个提交明确要进入当前 hosted `d0` preview 时，才执行一次受控同步。

### 3.5 每次同步后都按现有 runbook 做验证

每次把 `main` 的提交推进到 `codex/demo-d0-postgres-deploy` 后，都应按 `docs/planning/asiamath-demo-preview-ops-d0.md` 做相应验证：

- 确认 preview 指向的是预期分支 / 提交
- 必要时执行 reseed
- 跑 hosted smoke

凡是会影响 demo 数据、公开列表预期、登录后主讲路径、或 preview topology 的同步，都不应跳过这一步。

## 4. 什么条件满足后，才把部署来源切到 `main`

只有同时满足以下条件，才建议把部署来源从 `codex/demo-d0-postgres-deploy` 切到 `main`：

1. 候选 PR 已 merge，且 `main` 已包含当前 `d0` 稳定基线。
2. 当前没有只存在于 `codex/demo-d0-postgres-deploy`、但尚未回流 `main` 的 deploy-only 修复。
3. 基于 `main` 的候选部署已经按 `docs/planning/asiamath-demo-preview-ops-d0.md` 完成一次 hosted reseed + smoke。
4. `docs/planning/asiamath-sprint-1-demo-readiness-2026-04-29.md` 中的 must-pass path 与 role workspace 检查在同一候选版本上无已知 P0 blocker。
5. 下列文档已在同一次切换中同步改口径，不再混用“部署仍跟分支走”和“部署已跟 `main` 走”两套说法。

在这些条件同时成立前，继续把 `codex/demo-d0-postgres-deploy` 当作当前部署来源是更稳妥的短期策略。

## 5. 过渡期必须同步维护的文档

以下文档在这段过渡期里必须保持同一口径：

- `docs/planning/asiamath-d0-baseline-freeze-2026-04-29.md`
  短期策略总表。回答代码主线、部署来源、同步规则、cutover 条件。
- `docs/planning/asiamath-demo-preview-ops-d0.md`
  hosted preview 的实际 runbook、reseed、smoke 与拓扑说明。若活动部署来源或 preview 拓扑理解变化，这里必须一起更新。
- `docs/planning/asiamath-sprint-1-demo-readiness-2026-04-29.md`
  `DR-001` / `DR-005` 的执行与退出门槛文档。基线角色变化时，这里不能继续沿用旧表述。
- `docs/planning/asiamath-mvp-status-inventory-2026-04-29.md`
  项目当前阶段、稳定基线与 post-MVP 节奏的总盘点。若稳定基线或主线角色改变，需要同步。
- `docs/planning/asiamath-post-mvp-backlog-v1.md`
  `PMB-001` 所在 backlog。如果基线冻结规则完成或变化，任务说明与后续任务依赖要一致。
- `PROGRESS.md`
  实际 merge、同步、smoke、cutover 的交接日志必须落在这里，不能只停留在口头或聊天上下文。
- `docs/README.md`
  文档入口必须指向当前 planning 真理源，避免后续 Agent 又回退去读旧 feature list 当默认执行入口。

如果 demo 账号、seed 数据预期或公开列表预期发生变化，还应同步检查：

- `docs/planning/asiamath-demo-seed-contract-d0.md`

## 6. Freeze Statement

短期冻结结论只保留一句话：

> 在部署正式切到 `main` 之前，`codex/demo-d0-postgres-deploy` 继续是当前稳定 `d0` 基线与当前部署来源；一旦候选 PR merge，`main` 立即成为代码主线，但部署分支只作为受控同步的 release pointer 继续短期存在。
