# System Settings and Pixel UI — 2026-09-20

Project: yigrass.github.io

Task path: Personal Website / QQ Space MVP / System Settings and Pixel UI

Active task: System Settings and Pixel UI; status: completed; position: main. Return point: QQ Space MVP / Review updated desktop.

## 范围与结果

按用户本轮要求，从开始菜单移除“收起菜单”和内嵌设置，增加可独立打开、最小化、还原和关闭的系统设置窗口。三个既有设置保持原来的本机存储键与即时生效方式。设置控件只在窗口打开时创建；关闭后重开会使用当前配置，不依赖开始菜单中的隐藏表单。

窗口类型集中在 `assets/app.js` 的窗口注册表中，系统设置与个人信息、作品共用窗口生命周期。显示名称继续集中在 `assets/site-config.js`，其中增加 `menuLabels.settings`。

新增 `assets/pixel-ui/` 中的 14 份像素 PNG。菜单图标、窗口标题和任务栏图标、窗口控制符号、光标、星星及复选框图案使用这些资源。标题栏改用纯色，去掉旧的矢量光标、字符星星、旋转关闭符号和非整数图标缩放。文字、头像、作品封面和背景没有整体降采样。

## 验证证据

`assets/app.js` 和 `assets/site-config.js` 通过 V8 仅编译语法检查，配置在隔离对象中读取，三个菜单名称与原有默认设置正确。源码审阅核对了设置窗口创建、关闭重开、最小化还原、控件同步和本机设置存储的调用关系；这不等同于真实浏览器交互测试。

所有 14 份部署 PNG 均检查了 PNG 头部，确认为 bit depth 8、color type 3 的索引色图像。System.Drawing 独立解码核对了原生尺寸、非空像素、实际颜色数不超过 18、透明度仅 0/255。32×32 光标与原生 16×16 光标逐像素比对，确认每个原生像素精确复制为 2×2 色块。

部署后的 PNG SHA-256 与 `art/pixel-ui/manifest.json` 全部一致。已查看 `art/pixel-ui/contact-sheet.png`，核对了头像卡、文件夹、系统设置、开始图案、光标、星星和窗口控件的形状。HTML 和 CSS 的静态资源引用均存在；像素渲染规则只作用于专用 UI 元素，没有全局覆盖正文图片。`git diff --check` 通过。

## 工具与限制

使用 aseprite-automation 技能的固定启动器，Aseprite 版本为 1.3.18.1-x64。Doctor、Lua 生成和 15 次独立导出均成功，使用隔离用户配置，没有修改真实 Aseprite 用户设置。生成源码与 `.aseprite` 文件位于 `art/pixel-ui/`。

Doctor run: `C:\Users\a\Documents\Codex\2026-09-19\g-i-t\work\pixel-ui-assets\.aseprite-automation\runs\20260920-153722-e5db12db`。

Generation run: `C:\Users\a\Documents\Codex\2026-09-19\g-i-t\work\pixel-ui-assets\.aseprite-automation\runs\20260920-154132-5bcbca9e`。

Export run index: `C:\Users\a\Documents\Codex\2026-09-19\g-i-t\work\pixel-ui-assets\export-runs.json`。这些路径用于本轮工具追踪，不是网站构建或运行依赖。

本轮已通过权限工具获得真实仓库写入权限。共享 Node.js 和磁盘全局约定母本即使获得读取授权仍返回访问拒绝；本次沿用会话中用户提供的全局约定，JavaScript 检查使用可用 V8 编译能力，没有安装或替换工具链。

先前浏览器工具对本地文件 URL 的禁止仍然适用，没有尝试绕过。因此当前修改尚未完成真实浏览器、手机尺寸、键盘及鼠标交互验收；需要用户打开仓库中的 `index.html` 查看。完成的是本轮实现及上述静态和图像格式验证，整体 MVP 仍保留后续审阅。

## Git 与交付位置

直接修改真实仓库 `D:\01_SmallProjects\yigrass.github.io`。本轮基线为 `af18eed added win 95 style personal website MVP`，未执行 Git 写操作、提交、推送或远端访问。旧的预览 ZIP 和首次检查报告保留不变。
