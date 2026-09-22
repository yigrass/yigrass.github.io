# Explorer Project Categories review

Project: yigrass.github.io · Task path: Personal Website / Explorer Project Categories · Active task: Explorer Project Categories · Status: completed · Position: main

Date: 2026-09-23. Parent: Personal Website. Return point: Personal Website / Review project drives. This report records local implementation and focused checks; it does not claim browser acceptance for this iteration.

## Delivered scope

资源管理器按 A/C/G/H 排列。A 为小说软盘，G 为游戏光驱，H 为实用工具闪存盘；只保留一个本地磁盘 C，并保持空目录。根目录图标下显示各盘用途，进入目录后标题处显示分类。地址栏、左侧树、向上、对象计数和键盘焦点转移沿用原有结构。

`works` 支持 `novel`、`game` 和 `utility` 分类，按驱动器配置筛选。小说使用文本文件图标与 `.txt` 显示名称，已有后缀时不重复添加；入口在新标签页打开项目网页，因而可以承载配插图的小说。游戏使用光盘图标，工具使用已有控制面板图标。链接继续通过原 `safeURL` 过滤，名称通过 `textContent` 设置，独立标签页使用 `noopener noreferrer`。生产配置仍为 `works: []`，测试项目仅用于隔离检查，未加入网站。

新增 v1.2.0 闪存盘及文本文件图标、可编辑 Aseprite 源文件、生成 Lua 和 manifest。v1.1.0 及背景相关文件保留原样。README 说明分类和接入字段，并通过新事件记录用户对上一轮共用透明度与滚动条的网页验收；上一轮 QA 原文不改。

## Validation

`assets/app.js` 与配置通过工具环境 V8 `new Function` 编译，配置实际执行读取。聚焦的最小 DOM 检查通过 20 项断言，包括 A/C/G/H 顺序、C 唯一本地磁盘、四个空目录、按分类显示项目、小说后缀、项目链接属性、计数、向上与树导航、树折叠及焦点转移。检查源码见 `qa/explorer-project-categories/renderer-smoke.js`，结果见同目录 `renderer-results.json`。执行方式为 `new Function("appSource", "siteConfig", harness)(appSource, siteConfig)`；这里使用最小 DOM 与受控 `safeURL` 替身，验证范围为渲染和导航，不代替真实浏览器或 URL 解析器测试。

两个运行时 PNG 均解码成功，16×16、单帧、8-bit 索引色，透明度仅 0/255；闪存盘使用 10 色，文本文件使用 6 色。Aseprite 源头部确认尺寸 16×16、单帧、8-bit。运行时和源码 SHA-256 保存在 `art/pixel-ui/v1.2.0/manifest.json`。已查看 `contact-sheet.png`，确认 USB 插头和外壳、折角纸页及文本行；网站继续使用原有最近邻及整数倍图标显示规则。八个相关图标引用均存在。

图标使用 aseprite-automation 固定启动器，Aseprite 1.3.18.1-x64，隔离配置，doctor、Lua 和三次独立 export 最终均成功。具体成功运行目录见 manifest，原始日志保存在 `qa/explorer-project-categories/.aseprite-automation/runs/`。沙箱内生成与首次 PNG 导出因写入权限失败，使用同一启动器获准重试后完成；失败日志保留。图像验证初次错误使用 Time 帧维度导致 GDI+ 报错，改为 PNG 自身帧维度后验证通过。未调用裸 Aseprite，也未触碰真实用户配置。

受保护路径的本地 Git diff 为空。`git diff --check`、任务树生成与控制一致性检查通过。未执行 Git 写操作或远端操作。

## Review boundary

本轮未完成真实浏览器布局、点击或响应式验收；此前浏览器工具连接失败，本轮没有将替代检查描述成网页测试。用户上一轮的网页验收仅适用于共用透明度和经典滚动条。当前可在资源管理器查看四个空盘；真实小说项目接入后，再确认点击 `.txt` 入口的完整阅读体验。
