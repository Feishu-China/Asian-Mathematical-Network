# Sprint Contract Template

> **说明**: 此模板用于每次 Coding Agent 开始一个新 Feature 时的任务契约确认。

## 1. Feature 契约

*   **Feature ID**: [填写 v4.0 计划中的 ID，例如 FE-AUTH-001]
*   **Target EPIC**: [填写归属 Epic]
*   **Description**: [填写 Feature 描述]

## 2. 依赖项检查 (Pre-flight Check)

- [ ] Smoke Test 验证通过 (当前代码处于 Clean State)
- [ ] 前置依赖 Feature 已完成 (参考 v4.0 json `depends_on`)
- [ ] 已仔细阅读对应的 OpenAPI 契约或 DDL (如果需要)

## 3. 验收标准 (Definition of Done)

- [ ] 代码无 Lint 报错，能成功编译/运行
- [ ] 相关自动化测试/联调测试通过
- [ ] 没有对与本 Feature 无关的文件进行“顺手修改”

---

# Handoff Log Template

> **说明**: 此模板用于每次 Coding Agent 结束/挂起时的交接工件记录。

## 1. 工作总结

*   **Feature ID**: [填写的 ID]
*   **状态**: `Completed` / `In Progress (Blocked)`

## 2. 具体变更点 (What Changed)

*   [简要列出主要新增/修改的文件]
*   [如果修改了 API/数据库契约，必须在这里列出并解释原因]

## 3. 下一步建议 (Next Steps)

*   [写给下一个 Agent 的提示，例如："接下来可以开始 BE-AUTH-001"]