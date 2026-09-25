# Obsolete File Cleanup

Project: yigrass.github.io | Task path: Personal Website / Obsolete File Cleanup | Active task: Obsolete File Cleanup | Status: completed | Position: main

Date: 2026-09-25. Return point: Personal Website / Review cleanup and received-content naming.

本轮检查当前源码、模块引用、样式、运行时素材、构建与预览脚本、测试引用及依赖。原手写 Markdown 语法解析器在此前切换 markdown-it 时已经移除；当前 `src/shared/novel/parser.js` 是 markdown-it 配置与标题提取入口，`src/shared/novel/markdown.js` 是阅读器 DOM、图片与链接适配层，二者仍被使用。

## Changes

- 删除无人使用的旧头像 `assets/pixel-ui/profile.png`、已隐藏 README 条目所用的 `assets/pixel-ui/v1.4.0/information.png`，以及重复的 `assets/pixel-ui/v1.4.0/sword.png`。测试图标来源改为当前合同的完整示例；实际小说仍使用自身成品包里的宝剑图标。删除前字节数和 SHA-256 见 `removed-files.json`。
- 清理三个应用入口中的未使用导入、两处无外部调用的导出、重复的章节标识元数据，以及已废弃的资源管理器／项目预览样式和无匹配元素的树节点选择器。
- 从本地预览的构建监视目录移除不参与网站构建的合同文档目录。
- 保留用户的本地 `art/`、历史验收记录、历史合同交付 ZIP，以及实际使用中的网站和示例素材。未执行 Git 写操作或远端操作。

## Verification

`check.log` 记录完整现有检查通过：20 项测试（包含 231 项桌面断言）、源码与构建结果、成品接收和任务控制。`audit.json` 记录 25 个源码模块全部可从 `src/main.js` 到达，剩余 34 个运行时素材；删除的三个素材和原解析器均未残留在当前源码／构建产物中。未发现其他可确认废弃的模块或直接依赖。

已重新生成 `dist/` 并重启隐藏的本地预览进程（PID 11268）。预览输出见 `preview.stdout.log`，错误日志为空；`http://127.0.0.1:4173/file-explorer/a-floppy-disk/sh-tales/case-01/ep-02/` 返回 HTTP 200。本轮未修改界面布局，未重复进行浏览器视觉验收。

## Received-content naming

建议将接收成品的根目录命名为 `content/`，可同时包含小说、游戏和工具的完整成品；`works/` 也适合强调个人作品集的语义。`releases/` 容易让人联想到多版本发行记录。用户本轮询问候选名称，尚未选定迁移名称，因此未重命名目录或修改相关路径约定。
