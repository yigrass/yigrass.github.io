# Prepublication Review and Artifact Acceptance

Project: yigrass.github.io · Task path: Personal Website / Prepublication Review and Artifact Acceptance · Active task: Prepublication Review and Artifact Acceptance · Status: completed · Position: main · Date: 2026-11-07

本轮完成本地发布前检查和杂音当前成品接收，结论为 accepted。未执行 Git 写操作、远端通信或发布，未改动 content/ 中的交付字节。生产方版本号及独立摘要未提供，不能证明传输前后一致性；本轮收据准确标识本站实际接收的字节。

## 成品与网站检查

杂音当前共七章，新章节为 JHT-05-火之誓约和 JHT-06-烦恼种子。11 个成品文件通过固定根结构、清单字段、标识安全与唯一性、UTF-8、H1、清单顺序、包内引用及额外文件检查，没有未引用的额外文件。图标通过 Pillow 解码与 verify。逐文件比较真实 dist 内容及 SHA-256 收据，均与接收目录相同；git diff HEAD -- content/cacophony 为空，保留用户提供的内容。

完整 npm run check 通过：19 项测试、201 条桌面回归断言；构建生成 17 个静态页面。现有 HTTP 测试实际遍历生成路由和资源，逐一核对小说正文及图标请求；两个新章节同时出现在阅读索引与静态入口。首次沙箱检查因本机 HTTP 连接 EACCES 失败，经工具权限批准后完整重跑通过。未进行真实浏览器视觉验收，本轮没有界面功能修改。

检查证据见 [完整日志](check-verified.log)、[接收收据](acceptance.json) 和 [本轮只读检查程序](verify-received.mjs)。该程序仅覆盖当前合同实际使用的 Schema 断言关键字，遇到未知关键字即失败，不宣称是通用 JSON Schema 实现；网站正常构建未加入业务校验器。

## 文档与合同

当前架构统一维护在 [architecture.md](../../docs/architecture.md)，docs/ 现在只保留 architecture.md 与生成的 TASK_TREE.md，README 已更新链接及七章说明。原 docs/SOURCE_LAYOUT_PLAN.md 原文移至 [source-layout-plan.md](source-layout-plan.md)，未重写首次方案；历史任务、事件和报告中的旧路径作为溯源保留。归档原文中的相对链接仍以原 docs/ 所在位置为基准，其 ../README.md 对应仓库 README，../qa/ 对应仓库 qa/。此次记录承担新旧位置映射。

合同继续使用 novel-release-v4 / schemaVersion 4，包内结构不变；生产者输出位置统一表述为 `<artifact-root>/`，导出工具、机制、目录名及是否位于生产者仓库内均不受本站规定。本站自己的 dist/ 仍是网站构建输出。历史 v4 ZIP 保留首次交付字节，本次文本修订以接收收据记录的当前合同文件 SHA-256 区分，未覆盖历史 ZIP。

ARCHITECTURE.md → architecture.md 是仅大小写更名，Windows 文件系统已是小写名称；Git 索引仍显示旧拼写。依用户约定未执行 git mv 或暂存，用户处理提交时须将该更名记录到 Git。

## 通用技能

个人技能 [contract-acceptance](C:/Users/a/.codex/skills/contract-acceptance/SKILL.md) 已经工具批准安装，安装后 SHA-256 与本轮 [交付文件](contract-acceptance/SKILL.md) 一致，见 [安装收据](skill-installation.json)。技能按目标接收项目的 contracts/、当前状态及现有检查器工作，不内置本仓库格式、生产者路径或编号规则；用户复制成品后即可要求“按合同接收已拷入的成品”。它保护交付字节，区分本地接收、生产和发布，记录缺失来源证据并保留历次结果。

系统 quick_validate.py 因运行时缺少 PyYAML 无法启动，未安装新依赖。对本技能只有 name、description 两个普通字符串字段的 frontmatter 执行了等效字段、名称、长度及未完成占位检查，通过；证据见 [skill-validation.log](skill-validation.log)。另人工核对了缺失文件、未知合同、无生产者摘要、允许当前成品替换等分支的处理要求。未声称进行了独立 agent 行为验证。安装证明文件存在且字节一致，不代表当前会话的静态技能目录已刷新；新会话可自动发现，也可明确指定完整 SKILL.md 路径。

## 任务控制与后续

按 task-tree 技能改进现有生成器，使视图仅保留 Current Status 和 Task Tree；完整任务信息及追加历史仍在权威 JSON/JSONL。多层层级、工作标记、暂停状态、重复生成稳定、只读一致性检查，以及重复 id、未知 parent、环和无效引用的拒绝均验证通过，见 [task-view-validation.log](task-view-validation.log)。仅重建生成视图，不手工修改 TASK_TREE.md。

本任务完成后释放执行租约，返回 Personal Website / Review prepublication acceptance。网站整体仍 in_progress，原有待明确需求不改状态。用户可审阅本地修改，再自行处理 Git、推送及手动 Pages 发布；此次本地接收不代表远端已上线。
