# Project Window Routing Demo review

Project: yigrass.github.io · Task path: Personal Website / Project Window Routing Demo · Active task: Project Window Routing Demo · Status: completed · Position: main

Date: 2026-09-23. Parent: Personal Website. Return point: Personal Website / Review project window navigation. This record covers local implementation and explicit test boundaries.

## Scope and sequence

先完成侧边滚动条加宽，再开始占位项目接入。竖向滚动条与竖向箭头按钮宽度使用 25px，与窗口底部状态栏共用 `--statusbar-size`；横向滚动条仍为 16px，箭头图案和其他轨道、滑块状态保留。八条 SVG 图案声明与本轮开始时的 HEAD 内容一致。上下箭头内嵌在 `assets/styles.css`，`vertical:decrement` 是向上，`vertical:increment` 是向下，各含普通和 disabled 状态。用户已获知实际文件位置，可以手工调整。任务事件记录先完成这一项，再添加项目。

A 盘新增用户指定的 `Story-A.txt`，路由为 `/novels/story-a/`；G 盘新增 `Game-B.exe`，路由为 `/games/game-b/`。这两个项目属于交互演示占位，窗口只显示“施工中。”，游戏另显示已有光盘图标。C、H 保持空目录。没有生成新图像或修改原像素素材。

普通点击在当前标签页的共享桌面内打开项目窗口，每个项目只保留一个实例。最大化保留地址；最小化保留 DOM、窗口尺寸和内容状态；关闭移除该窗口。前台项目对应独立地址，系统窗口或空桌面对应主页。开始菜单作为浮层保持原地址。外部 url 作品仍使用独立标签页，内部入口保留可复制地址及 Ctrl/Cmd 等修饰键点击的普通浏览器行为。

新增 `assets/project-routes.js` 负责地址识别和历史，窗口生命周期仍由 `assets/app.js` 管理。正式打开新项目追加历史，任务栏切换、最小化及系统窗口等临时操作替换当前地址；追加下一次作品访问前恢复该历史槽的正式访问地址，避免资源管理器操作覆盖上一部作品的后退入口。浏览器历史转到主页时最小化项目而不销毁它们；返回项目地址则还原或重新打开该项目。

两个静态项目入口从根 `index.html` 生成，部署时需要一起保留。共享桌面资源使用固定根地址，不随 History API 路径变化。HTTP 下使用普通路径，直接访问和刷新均可由实际目录中的 `index.html` 启动对应项目。file 预览保持当前文件路径，使用 `#/novels/story-a/` 等片段标识项目，避免修改本地文件路径受到 History API 限制。直接访问和刷新只恢复地址对应的一个项目，不声称持久保存全部窗口或尚未存在的游戏存档。

## Verification

使用用户指定的已安装 Node v24.19.0，npm 11.17.0；未安装依赖。沙箱内无法启动该 Node，获准使用同一程序完成生成与检查。`assets/app.js` 和 `assets/project-routes.js` 通过语法检查，实际项目配置由检查脚本执行读取。

`qa/project-window-routing-demo/check.cjs` 在最小 DOM 和模拟浏览器历史中执行实际配置、路由与整个 app.js，57 项检查通过，明细见 `results.json`。覆盖普通点击拦截、Start 菜单、A/G 入口、占位内容与游戏图标、项目和系统窗口焦点、最小化/最大化/还原/关闭、多项目状态保留、重复打开去重、浏览器前进后退、修饰键点击、直接进入、静态文件别名、子路径托管和 file 片段地址；也检查静态资源引用和滚动条尺寸约束。窗口内容 DOM 身份、测试滚动位置和尺寸在任务栏还原后不变。该检查不是浏览器排版、鼠标捕获或视觉测试。

`scripts/generate-project-pages.cjs --check` 验证两个静态入口与当前根 HTML 一致。入口 `<base href="../../">` 和七个共享资源引用逐项检查；受保护的背景、像素资源、art 与此前验收报告无改动。`git diff --check` 和项目任务控制检查通过。

本机预览服务 `qa/project-window-routing-demo/preview-server.cjs` 仅绑定 127.0.0.1，只允许访问网站运行文件，不暴露任务报告或仓库控制目录。本次地址为 `http://127.0.0.1:11631/`；启动后对主页、两个项目入口、app.js、路由脚本和游戏图标做 HTTP 检查，六个响应均为 200 且非空，见 `http-results.json`。端口在重新启动时自动分配。该服务只用于本地审阅，不是产品构建或正式托管依赖。

## Browser review boundary

本轮浏览器工具库存请求返回 `apps: []`、`browsers: []`，错误为 `nodeRepl.fetch request failed`。没有使用其他浏览器控制技术绕过。Codex 的打开面板请求返回 queued，因此只记录已请求显示预览，不声称看见或完成真实浏览器验收。

建议人工依次打开 A 盘的 Story-A，最小化并从任务栏还原；再打开 G 盘的 Game-B，在两个窗口之间切换并观察地址；最后复制项目地址到新标签页或刷新，检查只打开对应项目。竖向滚动条需要在内容溢出的窗口中观察，箭头图案仍由用户手调。

本轮仅本地修改与检查，没有 Git 写操作、发布或远端通信。MVP 完成记录与原有待明确需求任务保留。
