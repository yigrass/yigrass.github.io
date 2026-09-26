# Demo Content Removal

Project: yigrass.github.io | Task path: Personal Website / Demo Content Removal | Active task: Demo Content Removal | Status: completed | Position: main

Date: 2026-09-26. Parent: Personal Website. Return point: Personal Website / Review demo cleanup.

## Changes

按照用户要求删除 content/sh-tales/、content/game-b/ 和 contracts/novel-release-v4/example/，共 23 个演示文件，包括正文、介绍、清单、重复宝剑图标和游戏占位 HTML／图标。删除前的逐文件路径、大小与 SHA-256 记录在 removed-files.json。目录登记只保留正式作品《杂音》；当前 README、架构说明和合同文档移除演示作品与已删除示例链接，合同仅保留格式说明和生产者 Schema。

桌面回归测试改为在测试进程内构造最小小说与网页响应，继续覆盖跨作品窗口、iframe、最小化、历史和主题行为，不再依赖任何上线的演示项目。构建测试按当前登记和成品清单验证页面、正文与图标，不固定某部小说的标题、章数或文件名；构建失败保留有效输出的用例改用临时副本中的非法目录 JSON。删除只针对已移除合同示例的旧测试，其原有跨卷同名章节和固定路径行为仍由现有阅读器／接收器测试覆盖。未修改应用源码或移除通用小说、游戏展示能力。

## Verification

check.log 记录 19 项测试通过，包含 197 项桌面断言，源码、真实静态构建和任务控制通过。dist 重建为 15 个桌面入口、一个成品；content/ 与 dist/content/ 均只含 cacophony。《杂音》的九个文件在源码及 dist 中逐一匹配此前正式接收记录的 SHA-256。扫描当前源码、工具、测试、目录配置、合同、README、架构文档及 dist，未发现旧演示书名或标识残留。

verification.json 记录五个旧入口／资源地址均返回 404，A 盘、G 盘、《杂音》介绍、首章和图标五个保留地址均返回 200。浏览器实际确认 A 盘只有「杂音.txt」，状态为一个对象；G 盘显示「此文件夹为空」，状态为零个对象。预览最后停在 A 盘，隐藏服务 PID 6940，错误日志为空。

历史任务、验收报告和已交付合同 ZIP 按既有约定保持原始记录，可能包含当时的演示名称；这些历史材料不参与构建或发布。本地 art 未修改。未执行 Git 写操作、清除 Git 历史或远端发布。
