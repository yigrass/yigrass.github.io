# Source and Release Separation

Project: yigrass.github.io · Task path: Personal Website / Source and Release Separation · Active task: Source and Release Separation · Status: completed · Position: main · Date: 2026-09-23

## Scope

用户明确批准整理源码、接收的独立项目成品和 dist 发布目录；后续讨论决定不建立作品开发源码目录，小说只保留当前章节和一份完整 release.json。本轮按该流程迁移并准备本地 Pages 工作流，不进行 Git 写操作和远端发布。全局母本已通过获准的只读操作核对，项目内未发现额外 AGENTS.md。

## Delivery

桌面源码迁入 src，并拆分窗口、任务栏、开始菜单、偏好、背景、路由和三个系统应用。作品目录独立到 catalog，Story-A 与 Game-B 的“施工中。”成品接入 releases。通用展示器读取小说纯文本和可选插图，或嵌入独立网页成品；没有新增任何真实作品正文。原光盘小图原样复制到自包含的演示游戏包。

build.mjs 在校验后生成首页和九个深层入口，沿用公开地址及既定窗口交互。dev.mjs 只服务 dist，旧根 HTML、根应用入口和旧入口生成器已移除。dist、构建暂存和测试临时目录均被忽略；art 和上线图片保持原字节。原目录计划保留，当前实现记录在 docs/ARCHITECTURE.md 和 README。

当前小说校验和基础展示属于接入实现；便于小说项目移交的完整合同文档、示例及独立验证随后由 Novel Release Contract 任务交付。提供手动替换完整成品目录的规则与校验命令，没有编写自动导入或删除用户作品的命令。

## Validation

使用用户指定的 Node v24.19.0 / npm 11.17.0，本轮没有安装依赖或更换运行时。scripts/check.mjs 通过源码语法、实际构建、19 项 Node 测试和任务控制检查。其中桌面回归用例包含 175 条记录断言，保留窗口聚焦、最小化、最大化、关闭、任务栏、深层入口、History、主题和透明度行为。

本机 HTTP 验证了十个入口、资源根、模块与样式 MIME、小说文本和维护路径不可访问。独立临时副本不含 art 或其他生产项目，仍可构建。缺失章节时构建失败并保留原 dist；15 章追加为 16 章及同路径修订通过，重复章节、空正文、非法路径、未知字段、无效 UTF-8、残留草稿和不合法插图被拒绝。已验证合同校验器复制到独立目录后可运行。

第一次测试有一项错误信息断言过窄：越界路径在 Schema 层提前被拒绝。将测试路径调整为先通过字段格式、再验证路径边界后，全套通过；未放宽产品校验。测试中的 VM Modules 警告只属于 Node 的模拟 DOM 测试工具，网站使用浏览器标准 ES modules。

操作前的 HEAD、索引和受保护文件摘要见 baseline.json。交付前复核原始 art、图片文件的 SHA-256、Git 索引与 HEAD；没有新增 Git 暂存、提交或远端操作。

浏览器工具返回空的 apps/browsers 和 nodeRepl.fetch request failed，未完成实际浏览器布局、视觉或指针测试，不把模拟 DOM 与 HTTP 检查称为浏览器验收。Pages 工作流仅本地准备，远端 Source 设置和实际部署仍由用户执行。

Return point: Personal Website / Review source and release separation。后继任务：Personal Website / Novel Release Contract。
