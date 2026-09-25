# Received Content Directory Rename

Project: yigrass.github.io | Task path: Personal Website / Received Content Directory Rename | Active task: Received Content Directory Rename | Status: completed | Position: main

Date: 2026-09-25. Parent: Personal Website. Return point: Personal Website / Review received content directory.

用户选择以 content/ 接收独立作品的完整当前成品。本轮将根 releases/ 原样移动到 content/，同步修改 catalog 中的接入路径、接收器的文件系统边界、作品图标路径识别、预览监视目录、现有测试和当前 README／架构／合同接入说明。构建结果为 dist/content/，桌面应用、作品、卷和章节页面地址不变。成品包内 release.json 的名称、格式和合同版本不变；脚本中的 release 术语仍表示发布成品。

迁移前记录的 13 个文件及其 SHA-256 见 before-files.json。迁移后的 content/ 和实际 dist/content/ 文件逐一与记录匹配；根 releases/ 与 dist/releases/ 均已不存在，没有保留兼容别名。保留历史 QA、已交付合同 ZIP、历史目录计划及本地 art，不改写历史证据中的旧路径。未进行 Git 写操作或远端操作。

完整检查见 check.log：20 项测试通过，包含 231 项桌面断言；覆盖真实静态入口、阅读器内容和图标、游戏 iframe、独立输入副本构建、失败时保留有效 dist、文件摘要和任务控制。git diff --check 通过。本轮没有改变布局，不另行执行浏览器视觉验收。

本地预览以隐藏进程重新启动，PID 9500，日志位于 preview.stdout.log 和 preview.stderr.log（为空）。首页、小说章节页、游戏页以及新路径下的 Markdown、小说图标、游戏 HTML 和游戏图标共七项 HTTP 检查均为 200；结果见 verification.json。之后通过 http://127.0.0.1:4173/ 查看，新增或替换成品统一放到 content/<project-id>/。
