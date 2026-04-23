# Asiamath MVP / Demo 双轨迭代治理规范

> Status: Draft v0.1  
> Updated: 2026-04-21  
> Purpose: 定义 Asiamath 在当前阶段如何同时推进 `MVP Core` 与 `Demo Breadth`，并在首个可演示版本之前建立明确的版本边界、接口冻结规则、验收门槛与后续长期治理原则。  
> This document is an execution-governance layer. It does not replace the current PRD, design spec, API spec, database schema, or feature list.

---

## 1. 文档定位

本文件回答的是执行治理问题，而不是产品范围定义问题。

它主要解决以下问题：

- `MVP` 是否要暂停
- `Demo` 是否要单独做一套产品或接口
- 首个可演示版本之前，哪些改动允许继续发生，哪些必须冻结
- 首个可演示版本之后，`MVP vNext` 与 `Demo` 如何继续并行演进

本文件的时间范围分为两段：

- `Phase A`: 现在到首个可演示版本之前
- `Phase B`: 首个可演示版本之后的长期治理

`Phase A` 写得更细，因为这是当前最容易失控的阶段。  
`Phase B` 写得更粗，只定义后续版本治理原则。

---

## 2. 与现有文档的关系

本文件服从以下文档优先级：

1. `docs/specs/asiamath-api-spec-v2.1.md`
2. `docs/specs/asiamath-database-schema-v1.1.md` 与 `database/ddl/asiamath-database-ddl-v1.1.sql`
3. `docs/product/asiamath-mvp-prd-v3.2.md`
4. `docs/product/asiamath-demo-prd-v3.1.md`
5. `docs/specs/asiamath-design-spec-v2.1.md`
6. `docs/specs/asiamath-technical-spec-v2.1.md`
7. `docs/planning/asiamath-feature-list-v4.0-optimized.json`
8. 本治理文件

本文件不重新定义：

- 核心产品范围
- 页面骨架
- API 字段语义
- 数据库语义

本文件只定义：

- 如何分轨推进
- 如何冻结和放行变更
- 如何组织版本与验收
- 哪类工作进入 `MVP Core`，哪类工作进入 `Demo Breadth`

---

## 3. 核心结论

### 3.1 MVP 不暂停

`MVP` 不应整体暂停。  
但从当前时点开始，`MVP` 不再适合继续无边界扩范围，而应进入：

- 主干稳定优先
- 闭环优先
- 向后兼容优先

的迭代模式。

### 3.2 Demo 不单开产品形态

`Demo` 不应做成一套独立产品，也不应自创一套接口、路由、对象命名或状态体系。  
`Demo` 必须建立在与 `MVP` 相同的产品骨架之上，并与当前 `PRD/spec` 保持一致。

### 3.3 双轨不是双系统

双轨的含义是：

- `MVP Core`: 做薄但真实的核心闭环
- `Demo Breadth`: 在同一骨架上补充更广的展示覆盖，可使用 mock、static 或 hybrid 数据

双轨不意味着：

- 两套前端
- 两套路由
- 两套对象模型
- 两套 API contract
- 两套状态语义

---

## 4. 双轨模型

### 4.1 Track A: MVP Core

`MVP Core` 的目标是交付真实、可运行、可验证的最小闭环。

此轨道负责：

- 真实认证与会话
- 真实持久化
- 真实申请、评审、决策、发布闭环
- 权限与状态语义正确性
- 主故事线涉及的真实数据流

此轨道的成功标准是：

- 不是页面看起来完成
- 而是闭环真实成立，且关键规则由后端和服务层保证

### 4.2 Track B: Demo Breadth

`Demo Breadth` 的目标是扩大可展示范围，使系统在演示时看起来完整、连贯、可信。

此轨道负责：

- 更广的页面触点
- 更丰富的角色视图
- `Hybrid / Static preview` 页面
- 演示所需的预置数据、状态样本和 walkthrough 支持

此轨道的成功标准是：

- 不是所有页面都真实联通
- 而是所有展示都不违背当前 contract 与产品语义

### 4.3 共享约束

两条轨道必须共享以下要素：

- 信息架构
- 路由结构
- 页面命名
- 对象命名
- 状态语义
- 角色边界
- `M2-M7` 依赖规则
- `API contract` 方向

---

## 5. Phase A: 首个可演示版本之前

本阶段的目标不是“做完所有模块”，而是建立一个稳定、可讲述、可彩排的演示基线。

### 5.1 本阶段总目标

在首个可演示版本之前，团队应同时达成以下两件事：

1. 完成主故事线所需的真实闭环
2. 用同一产品骨架补齐演示必要的广度触点

### 5.2 当前优先级

在当前 `v4.0` feature list 下，首个可演示版本之前的核心顺序应固定为：

1. `GRANT`
2. `REVIEW`
3. `PORTAL`
4. 只为演示补最少量的 breadth 页面
5. 最后做讲解顺序、预置数据与页面模式标识的 polish

### 5.3 近期里程碑

建议在 `Phase A` 中采用以下里程碑：

- `Milestone A1`: 完成 `INT-GRANT-001`
- `Milestone A2`: 完成 `INT-REVIEW-001`
- `Milestone A3`: 完成 `INT-PORTAL-001`
- `Milestone A4`: 建立首个 `Demo Baseline`
- `Milestone A5`: 补充 Demo breadth 页面与讲解支撑

在 `A4` 之前，所有新工作都应证明自己服务于：

- 主故事线闭环
- 演示完整性
- 或者主干稳定性

否则默认延后。

---

## 6. Phase A 版本边界

### 6.1 允许继续做的新版本迭代

在 `Phase A` 内，允许继续做 `MVP` 新版本迭代，但必须遵守以下约束：

- 优先做闭环补完
- 优先做兼容增强
- 优先做 bugfix 与一致性修复
- 避免引入新的大范围产品分支

换言之，本阶段可以有 `MVP vNext`，但不应该出现“重新定义 MVP”的行为。

### 6.2 版本线定义

建议同时维护两条逻辑版本线：

- `MVP Core` 版本线
- `Demo Baseline` 版本线

推荐命名方式：

- `MVP Core v0.x`
- `Demo Baseline d0`, `d1`, `d2`

其中：

- `MVP Core v0.x` 表示真实能力迭代
- `Demo Baseline dN` 表示某一轮可演示快照

`Demo Baseline` 不是独立产品版本，而是建立在某个 `MVP Core` 基线之上的演示快照。

### 6.3 首个 Demo Baseline 的定义

首个 `Demo Baseline` 只有在以下条件同时满足时才成立：

- `AUTH` 已真实联调
- `PROFILE` 已真实联调
- `CONF` 已真实联调
- `GRANT` 已真实联调
- `REVIEW` 已真实联调
- `PORTAL` 已真实联调
- 主故事线可以从头到尾顺畅演示

在此之前，所有“demo 丰富化工作”都不能以牺牲上述主线闭环为代价。

---

## 7. 变更分类与准入规则

### 7.1 变更类型

所有工作在进入开发前，都必须被归类为以下四种之一：

- `Core Closure`
- `Demo Breadth`
- `Stability / Consistency`
- `Contract Change`

### 7.2 Core Closure

属于以下情况的工作归为 `Core Closure`：

- 直接补齐 `v4.0` 中尚未完成的真实闭环能力
- 完成主故事线必需的真实接口与真实页面
- 修复主故事线的权限、状态、数据一致性错误

`Core Closure` 默认允许进入当前迭代。

### 7.3 Demo Breadth

属于以下情况的工作归为 `Demo Breadth`：

- 增加 `Hybrid` 页面
- 增加 `Static preview` 页面
- 增加演示所需的样例数据、引导信息、讲解辅助 UI
- 为非核心模块增加入口页、预览页或展示页

`Demo Breadth` 允许进入当前迭代，但不得阻塞 `Core Closure`。

### 7.4 Stability / Consistency

属于以下情况的工作归为 `Stability / Consistency`：

- 修复 contract 对齐问题
- 修复 mock 与 real provider 的行为不一致
- 修复 page mode 标识缺失
- 修复关键页面的角色或状态表达错误

`Stability / Consistency` 在 `Phase A` 是高优先级工作，因为它直接影响彩排和可信度。

### 7.5 Contract Change

属于以下情况的工作归为 `Contract Change`：

- 修改已有 endpoint 语义
- 修改已有字段命名或状态值
- 修改关键路由骨架
- 改变对象归属关系

`Contract Change` 在 `Phase A` 默认禁止，除非满足第 9 节的例外流程。

---

## 8. Demo 允许的实现方式

### 8.1 允许的数据模式

在首个可演示版本之前，页面可采用以下三种模式：

- `Real-aligned`
- `Hybrid`
- `Static preview`

### 8.2 模式定义

`Real-aligned`

- 页面主要依赖真实后端和真实状态流
- 可以存在少量演示数据预置
- 不可伪造关键结果

`Hybrid`

- 页面骨架、字段、状态语义与真实 contract 对齐
- 局部区域可使用 mock/static 数据
- 页面必须清楚表达哪些区域是真实对齐，哪些区域是演示补足

`Static preview`

- 仅用于展示未来模块、非核心 breadth 页面或非主线辅助页面
- 仍必须遵守现有对象命名、状态语义和路由策略
- 不得暗示当前已有真实闭环

### 8.3 明确禁止

以下做法在 `Phase A` 明确禁止：

- 为 demo 单独发明一套接口
- 为 demo 单独发明一套路由
- 为 demo 重新命名已有对象
- 为 demo 定义不同于 MVP 的状态值
- 用纯视觉稿替代主故事线的关键动作页面
- 用静态结果页冒充真实已联通的决策/发布流程

---

## 9. Contract 冻结规则

### 9.1 当前默认冻结对象

以下内容从现在开始默认进入“冻结优先”状态：

- `/api/v1` 的总体 contract 方向
- 已完成真实联调的 `AUTH / PROFILE / CONF` 页面骨架
- 角色命名
- 对象命名
- 关键状态语义
- `M2 / M7` 的记录分离原则

### 9.2 允许的 contract 变化

在 `Phase A`，只允许以下 `additive changes`：

- 新增可选字段
- 新增不破坏旧调用方的 endpoint
- 新增页面 mode 标识或展示辅助字段
- 新增不会改变原语义的聚合读模型

### 9.3 默认禁止的 breaking changes

以下变化默认视为 breaking change：

- 重命名已有字段
- 删除已有字段
- 修改已有状态枚举含义
- 修改 endpoint 的核心输入输出结构
- 调整 route skeleton 导致页面语义变化

### 9.4 例外放行条件

只有同时满足以下条件，breaking change 才可进入评估：

1. 不改会导致主故事线无法成立，或产生严重误导
2. 无法通过 additive 方式解决
3. 已明确列出受影响页面、接口与测试
4. 已同步更新相关 spec 或至少留下正式 drift 记录
5. 已安排同轮修复所有受影响的 provider、mock、page mode 和测试

若以上条件不能同时满足，则本轮不应做 breaking change。

---

## 10. 前端实现规则

### 10.1 一律以同一 contract 为前提

前端必须假设自己始终面对同一套 contract。  
“真实 API” 与 “demo/mock/static” 的差异只能体现在 provider 或 adapter 层，不得扩散到页面层的对象命名和字段语义。

### 10.2 页面层禁止直接分叉产品语义

页面层可以因为 page mode 不同而显示不同深度的内容，但不得：

- 改变主对象结构
- 改变状态含义
- 改变角色能力边界

### 10.3 推荐的 provider 策略

推荐统一为各主线模块建立明确 provider 边界，例如：

- `authProvider`
- `profileProvider`
- `conferenceProvider`
- `grantProvider`
- `reviewProvider`
- `portalProvider`

每个 provider 至少应支持：

- `http` 或 real provider
- `fake` 或 demo provider

当页面进入 `Hybrid` 模式时，应通过 provider 选择和预置数据来实现，而不是在页面组件里硬编码两套流程。

### 10.4 Mock / Fake 数据要求

Mock/Fake 数据不是随意填充的视觉素材，必须满足：

- 字段结构符合当前 contract
- 状态语义符合当前 spec
- 可以支持主故事线与次故事线讲解
- 与角色权限逻辑不冲突

---

## 11. 后端实现规则

### 11.1 MVP 主干优先

在 `Phase A`，后端新增工作优先级为：

1. 主故事线闭环
2. 规则校验
3. 聚合读模型
4. 演示便利性支持

### 11.2 后端不要为 demo 开分叉接口

后端不得为了演示方便而单独创建与主 contract 语义冲突的“demo API”。  
若演示需要特殊数据，应优先通过：

- seed data
- fixture
- demo account
- readonly aggregate view

来解决。

### 11.3 规则必须落在服务层或持久化边界

以下规则不能只停留在页面提示：

- conference 与 grant 的依赖关系
- review assignment 的 COI 限制
- decision issue 与 release 的区分
- applicant 仅能看到 released result

---

## 12. 验收与冻结门槛

### 12.1 每个 Feature 的常规门槛

任何 feature 进入 `completed` 之前，至少应满足：

- 对应页面或接口可运行
- 自动化测试通过，或已有清晰的联调验证
- 未引入与本 feature 无关的顺手修改
- handoff 工件完整

### 12.2 进入 Demo Baseline 的额外门槛

任何页面或流程若要进入 `Demo Baseline`，除常规门槛外，还应满足：

- 页面 mode 明确
- 当前角色清晰
- 空态、进行中、内部结果、对外结果表达一致
- 若为 `Hybrid` 页面，真实与 mock 的边界清楚
- 可被纳入演示脚本而不依赖口头补救说明

### 12.3 Demo Freeze

一旦某轮 `Demo Baseline` 确定，主故事线涉及的以下对象进入冻结期：

- 主讲页面顺序
- 关键角色切换方式
- 主讲用数据集
- 主讲用 contract 行为

冻结期内允许：

- 修 bug
- 补文案
- 做不改变讲解结构的小型 UI polish

冻结期内不允许：

- 改主故事线顺序
- 改关键状态表达
- 改关键 contract 语义
- 改演示数据导致讲解脚本失效

---

## 13. 发布与分支建议

本节是建议，不是强制替代现有 git 流程。

### 13.1 建议的逻辑分支

建议区分以下三类逻辑分支或里程碑概念：

- `main` 或主干稳定线
- `mvp-core/*`
- `demo-breadth/*`

如果团队不希望增加长期分支，也至少应在 issue / PR / feature contract 中标记其归属轨道。

### 13.2 Demo Baseline 快照

每当形成一轮可彩排的演示版本，应记录一个明确快照：

- 对应的 commit
- 对应的 `MVP Core` 版本
- 对应的 `Demo Baseline` 名称
- 使用的数据集或 demo account
- 当前已知限制

### 13.3 本地优先

在首个可演示版本之前，允许先在本地完成：

- 文档治理
- 轨道划分
- 版本命名
- staging 审阅

再决定何时推送远端。

---

## 14. Phase B: 首个可演示版本之后

首个 `Demo Baseline` 建立后，治理重点从“防止失控”转向“兼容扩展”。

### 14.1 长期原则

后续长期演进应遵守以下原则：

- `MVP Core` 继续演进，但默认向后兼容
- `Demo Breadth` 可以继续扩展，但不得背离现有骨架
- 新模块优先以 `Static preview` 或 `Hybrid` 起步，再逐步真实化
- 所有跨层变化仍应先更新 scope/spec，再更新 feature plan

### 14.2 后续 contract 治理

首个可演示版本之后，可以更从容地接受 contract 演进，但仍建议分级：

- `Level 1`: additive change，可常规推进
- `Level 2`: bounded breaking change，需要完整影响面评估
- `Level 3`: structural redesign，需要先改文档，再改实现，再重建 demo 基线

### 14.3 Demo 不是临时视觉层

长期来看，`Demo Breadth` 应尽量成为未来真实模块的前置壳层，而不是一次性演示垃圾层。  
任何新增 breadth 页面都应尽量复用：

- 相同路由
- 相同 page shell
- 相同 provider 边界
- 相同 contract 方向

### 14.4 重建基线的触发条件

若未来发生以下情况，应主动重建 demo 基线：

- 主故事线变化
- 核心 contract 发生 bounded breaking change
- 角色或状态语义变化
- 关键页面重构导致演示脚本失效

---

## 15. 当前建议的执行顺序

截至 `2026-04-21`，建议按以下顺序推进：

1. 完成 `FE-GRANT-001` / `BE-GRANT-001` / `INT-GRANT-001`
2. 完成 `FE-REVIEW-001` / `BE-REVIEW-001` / `INT-REVIEW-001`
3. 完成 `FE-PORTAL-001` / `BE-PORTAL-001` / `INT-PORTAL-001`
4. 统一 provider 边界，补齐 mock/real 切换策略
5. 为主故事线建立 demo 数据与彩排脚本
6. 仅补主讲需要的 breadth 页面
7. 形成首个 `Demo Baseline`

在第 7 步之前，不建议插入新的大模块实现或新的产品范围扩张。

---

## 16. 一页决策规则

当团队面对某项新工作时，可按以下规则快速决策：

### 可以现在做

- 它补齐主故事线闭环
- 它修复 contract / provider / page mode 一致性
- 它直接提升演示可信度且不改骨架

### 可以做，但排在后面

- 它是 breadth 页面
- 它不阻塞主故事线
- 它不引入新的 contract 风险

### 现在不要做

- 它会改变已有对象命名或状态语义
- 它需要新开一套 demo 接口或 demo 路由
- 它只是看起来更完整，但不服务于主故事线或演示基线

---

## 17. 维护要求

当以下任一情况发生时，应回看并更新本文件：

- 首个 `Demo Baseline` 已建立
- `Phase A` 结束，进入长期治理阶段
- 发生不可避免的 breaking change
- 双轨节奏出现明显冲突
- `v4.0` feature list 已基本完成，需要新的 backlog 组织方式

本文件建议作为 `docs/planning/` 下的执行治理入口文档使用。
