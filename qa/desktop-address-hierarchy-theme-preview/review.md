# Desktop Address Hierarchy and Theme Preview

Project: yigrass.github.io. Task path: Personal Website / Desktop Address Hierarchy and Theme Preview. Active task: Desktop Address Hierarchy and Theme Preview. Status: completed. Position: main. Date: 2026-09-23. Return point: Personal Website / Review desktop navigation and theme candidates.

本轮将横竖滚动条和四个箭头按钮统一为 20px，保留 25px 状态栏、15px 箭头 PNG 及其他滚动样式。应用、磁盘和文件采用统一层级地址，内部内容分类不出现在目录名及资源管理器标签中。原有背景、填充色、dithering 和生产环境主题颜色未改变。

## 实现与维护

地址定义位于 `assets/site-config.js`：应用配置 `applicationRoutes`，磁盘配置 `slug`，项目配置 `driveId` 和 `slug`。浏览器和入口生成器共用 `assets/project-routes.js` 中的目录逻辑；完整地址由这些字段组合而成。`scripts/generate-project-pages.cjs` 已生成并检查 9 个正式入口和 2 个旧链接兼容入口。路径清单见 README，旧记录保持原样。

前台应用决定地址，资源管理器在聚焦或还原时使用自己当前磁盘的地址。正式打开新应用或项目、进入或离开磁盘增加历史记录；窗口切换、最小化和还原只替换当前地址。开始菜单浮层和最大化不导航。全部最小化或历史返回桌面时使用主页地址，并保留现有窗口 DOM；关闭后的窗口再次打开会重新创建。直接打开或刷新一个地址只打开对应窗口。根目录托管、子路径托管和本地文件的 hash 预览均受检查覆盖。

三套夜间配色仅在当前对话的独立预览中展示：中性炭灰、鼠尾草灰、石板蓝灰；包含标题栏、内容区、选择状态、开始菜单和任务栏按钮。可用预览设计控件切换日间参照，未接入网站设置和持久化偏好。预览路径由任务快照的 `previewPath` 记录，供本地检查定位；该路径不是网站运行或构建依赖。

## 验证

- `check.cjs` 使用实际应用代码和最小 DOM/History 模拟环境，通过 196 项行为及资源检查，涵盖多窗口切换、磁盘地址、前进后退、直接入口、旧地址规范化、资源根、重复窗口、目录验证与 20px 尺寸。`results.json` 保存具体断言。
- 静态生成器 `--check` 确认 11 个入口均与根 HTML 一致、相对资源根深度正确。应用配置、路由和主脚本已在检查中执行，独立预览 JavaScript 编译通过。
- `preview-server.cjs` 通过 16 项回环 HTTP 检查，结果在 `http-results.json`。服务只监听 `127.0.0.1` 并允许本站运行文件和声明的入口；本地预览排除维护目录，不表示远端发布也采用这个规则。
- 原始箭头 SHA-256 仍为 `85b23c2251236cbfc477c9682d5951578f4b89ec78c13ca3ec4725aa5caa6028`。只读 Git 差异检查确认 `art/`、`assets/pixel-ui/`、`assets/wallpapers/`、`assets/wallpaper-edges.js`、根 `index.html` 没有修改。CSS 差异只涉及滚动条尺寸变量；生产主题色未更改。
- `git diff --check` 通过；完成后运行任务视图生成器和控制检查器。

浏览器工具返回空浏览器列表及 `nodeRepl.fetch request failed`，无法完成真实浏览器的视觉、布局或点击验收。上述结果只证明模拟交互与本机 HTTP 行为，不能当作浏览器验收或远端托管验证；配色预览也没有完成浏览器截图验收。Codex 打开本地预览请求返回 queued。

## 资源目录说明

`art/` 是制作过程和原稿归档；`assets/` 是页面使用的运行文件目录，其中也可能存在未使用的旧资源。实际页面未引用 `art/`，但仓库没有发布过滤配置；不能据此声称 `art/` 会自动排除。GitHub Pages 从分支发布默认使用 Jekyll，相关静态文件和排除规则依据 [GitHub 官方说明](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll)。本轮没有改变发布流程、联系 Git 远端、执行 Git 写操作或部署。
