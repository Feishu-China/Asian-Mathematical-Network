# AI Agent 开发约束与工作脚手架 (Agent Harness)

> **目标**：本文档旨在根据 Anthropic 关于 [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) 的研究，为参与本项目开发的所有 AI Agent（如 Trae, Cursor 等）提供确定性、高效率的工程边界（Harness）。

AI 在多会话、长周期的开发中容易出现“上下文遗忘”、“越界修改”和“状态污染”。为解决这些问题，本项目的任何 Agent 开发都**必须且只能**遵循以下脚手架纪律：

## 1. 核心工作模式 (The "Shift Work" Model)

Agent 不应试图一次性完成所有任务，而是采用“倒班制”（Shift Work），这在实际操作中通过不同的“人类引导语”来区分角色：

*   **Initializer Agent 模式**（作为架构师/环境准备者）：
    *   **触发场景**：每个新对话（Session）的第一次互动，或者项目的初始阶段。
    *   **职责**：阅读规划文件（如 `v4.0-optimized.json`），搭建基础环境，安装依赖，创建工程脚手架（如执行 `HARNESS-001` 和 `CONTRACT-001`），进行全局状态的 Smoke Test。
    *   **输出**：不写具体业务代码，只产出环境配置、契约文件、日志模板和开发指南。

*   **Coding Agent 模式**（作为纯粹的螺丝钉开发）：
    *   **触发场景**：在环境就绪后，人类发出“请实现特性 X”的具体指令。
    *   **职责**：阅读 `PROGRESS.md` 确认上下文，**只专注于** `asiamath-feature-list-v4.0-optimized.json` 中的某**一个** Feature（如 `FE-AUTH-001`）。
    *   **输出**：完成该特性的代码，运行对应测试，更新状态并留下 Handoff Log，然后立即停止，不越界去写下一个 Feature。

## 2. 必须遵守的铁律 (Strict Working Rules)

1.  **One Feature at a Time（单一功能推进）**
    *   在任何一次会话中，Agent 只能专注于 `v4.0-optimized.json` 中的**一个**未完成 (`"passes": false`) 的 Feature。
    *   禁止在一个对话轮次中跨越多个 Feature 进行文件修改，避免回滚困难。

2.  **Run Smoke Test Before & After（开发前后必须验证状态）**
    *   在编写新代码前，必须确保当前项目可运行（Clean State）。
    *   新代码完成后，必须运行单元测试或 Smoke Test 确认没有破坏现有功能。

3.  **Read-Only Source of Truth（不可篡改的真理源）**
    *   `docs/planning/` 和 `docs/product/` 下的文件（尤其是 Feature 列表的定义和验收标准）对 Agent 是**只读**的（除非 PM 或用户明确指令要求修改）。
    *   Agent 只能将完成的 Feature 的 `"status"` 改为 `"completed"`，并在 E2E 验证后修改 `"passes": true`。

4.  **Handoff Artifacts（硬性交接工件）**
    *   Agent 会话结束（或被中断）前，**必须**输出一份总结日志。
    *   如果修改了 API，必须在对应的 `docs/specs/` 文件或临时文件中留下记录。
    *   如果引入了新的环境变量，必须写明在 `.env.example`。
    *   **Git Commit & Push**: 在本地日志更新完毕后，必须使用 `git commit -am "feat: <feature_id> description"` 进行本地提交，并执行 `git push` 同步到远程仓库，确保进度不丢失。

## 3. 开发会话的标准流程 (Standard Session Flow)

每当你作为 Agent 启动一次全新的开发任务时，请自动执行以下流程：

*   **Step 1 (Context)**: 读取 `docs/planning/asiamath-feature-list-v4.0-optimized.json`，找到当前优先级最高且 `status: not_started` 或 `in_progress` 的 Feature。
*   **Step 2 (Verify)**: 读取现有的 `PROGRESS.md`（如有），并通过 Terminal 检查当前项目是否处于 Clean State。
*   **Step 3 (Implement)**: 根据 Feature 描述进行代码实现。
*   **Step 4 (Test)**: 编写或运行相关测试（单元测试 / 桩数据联调测试）。
*   **Step 5 (Handoff)**: 修改 JSON 文件中该任务的状态，更新交接日志，并等待用户审查。

---
> *作为 AI，在未来的每一次回复和工具调用中，请将这 5 步标准流程作为你的系统提示隐式执行。*
