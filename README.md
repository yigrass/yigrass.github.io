# yigrass.github.io

Meet me here.

这是一个以 Windows 95/98 桌面为视觉参考的个人空间原型。网站使用原生 HTML、CSS 和 JavaScript，可由 GitHub Pages 直接托管，无需安装依赖或执行构建。

## 本地查看

使用浏览器打开 `index.html`。初始桌面只有背景和任务栏，没有预先打开的内容窗口。点击左下角“开始”，可以打开我的电脑、资源管理器或系统设置。再次点击开始按钮、点击菜单之外，或按 Escape，均可关闭开始菜单。

窗口支持最小化、最大化、还原和关闭；任务栏中的窗口按钮用于切换或还原。宽屏下可以拖动窗口标题栏，并从四条边或四个角拖动调整窗口大小。窗口有最小尺寸与桌面边界限制；最小化和最大化还原保留本次尺寸，关闭后重新打开恢复默认大小，不保存尺寸到浏览器。窄屏下窗口占据主要内容区，边框缩放停用，菜单浮在桌面上，选择内容后收起。

“资源管理器”提供常驻左侧文件夹导航、地址选择栏和“向上”按钮。A:（3.5 英寸软盘）收纳小说，G:（光盘驱动器）收纳所有游戏，H:（闪存盘）收纳实用工具；本地磁盘只保留 C:，暂时留空。根目录图标下标明各盘用途。树内节点可以展开或折叠，左栏本身始终显示。工具栏不再提供后退、前进或隐藏左栏按钮。这些是网站内的虚拟目录，不读取访客电脑，也没有虚构容量或文件。关闭后重新打开会回到根目录。

“我的电脑”采用系统属性结构，包含“常规”“个人介绍”“联系信息”三个页签，用来展示个人资料。页签支持点击，以及键盘左右箭头、Home 和 End 切换。常规页保留已知昵称与签名，其他内容先留空。这里没有真实设备信息或硬件检测功能。

“系统设置”是独立窗口，提供开始菜单与任务栏共用的底色透明度、自定义光标和漂浮星星三个设置，可最小化、还原和关闭。修改即时生效，并在浏览器允许时保存在本机；关闭窗口后再次打开会显示当前设置。开始菜单和任务栏默认不透明，底色透明度通过同一滑块一起调整，文字、图标和按钮保持清晰；已保存的透明度值继续生效。部分浏览器直接打开本地文件时可能不保存设置，但不影响基本浏览。系统偏好减少动态效果时不播放星星动画。

UI 图标、窗口按钮、光标和星星采用原生小尺寸 8-bit 索引色 PNG，以整数倍和最近邻方式显示；文字、头像和作品图片保持高清。像素素材的可编辑源文件与格式检查记录位于 `art/pixel-ui/`。

活动窗口标题栏、菜单选中条与目录选中条采用已选定的 A 方案墨黑 `#202020`，由 `assets/styles.css` 的 `--accent` 统一控制。

滚动区域采用 Win95 风格：银灰方形滑块与箭头按钮、凹凸边框、黑白灰点阵轨道，以及按下和禁用状态。竖向滚动条宽度与横向滚动条高度均为 25 像素，四个方向的箭头按钮均为 25×25 像素，与窗口底部状态栏共用 `--statusbar-size`。箭头使用一张独立的向上 PNG 原图，其他方向和禁用状态由它自动生成，编辑方法见下文。Chrome、Edge 等支持滚动条伪元素的浏览器显示完整样式；不支持这些伪元素的浏览器保留原生尺寸与对应灰色。滚轮、键盘、拖动滑块及点击箭头均继续由浏览器处理。首次共用透明度与滚动条检查见 `qa/shell-transparency-classic-scrollbars.md`，本轮资源整理见 `qa/scrollbar-arrow-assets.md`。

## 编辑网站

箭头的唯一图像编辑入口是 `assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png`，可直接用 Aseprite 打开修改。保持 15×15、单帧、透明背景和硬边像素；图案朝上，四周留出透明像素。保存后在项目根目录运行 `./scripts/generate-scrollbar-arrows.ps1`，再刷新网页。脚本通过已配置的 Aseprite 自动化启动器生成右、下、左三个旋转版本，以及四个方向的灰色禁用版本，输出到同级 `generated/`，不会覆盖原图；这些派生文件不要手工编辑。`art/pixel-ui/v1.3.0/` 中的 initial Aseprite 文件和 create 脚本只记录首次绘制，后续修改以该 PNG 为准。生成后的图片直接由 CSS 引用，本地文件预览不需要浏览器读取 canvas 像素，网站运行也不依赖 Aseprite。

编辑 `assets/site-config.js`，可更改开始按钮文字、菜单名称、个人信息、虚拟驱动器名称、背景地址和默认设置。文件中的注释提供字段说明。菜单名称与模块身份分开，所以改名不会改变对应模块；内部 `profile`、`works` 和 `settings` 标识保留不变。

当前资料仅使用仓库已存在的信息：昵称为 `yigrass`，签名为 `Meet me here.`。头像、介绍和联系方式等待添加。头像为空时显示电脑图标，填写头像路径后以正常分辨率显示图片。Story-A.txt 和 Game-B.exe 是用户指定的交互演示占位项目，尚无真实作品内容。

默认背景采用用户选定的灰绿色海边舱室像素画，文件为 `assets/wallpapers/ocean-capsule-pixelart-v2.png`。来源是用户在 Aseprite 中调整尺寸后的 `art/backgrounds/ocean-capsule-v2/draft-pixelart-ase.png`，实际尺寸为 3840×2160（16:9），文件大小为 215072 字节，接入时原样复制。背景在任务栏上方的桌面区域内等比例缩放、居中完整显示（`contain`），不裁剪、不平铺；桌面区域比图片更宽时左右留白，更窄时上下留白，比例相同时无留白。填充及载入前底色采用图中阴影的深灰 `#2d2f2d`，由 `assets/site-config.js` 的 `themeColor` 设置，CSS 的 `--desktop` 和脚本缺省值保留相同底色；浏览器主题色也使用相同深灰。`assets/wallpaper-edges.js` 在图片四周叠加由 2 CSS 像素方块组成的有序抖动过渡，边缘逐渐融入填充色，过渡带最多 40 CSS 像素，窄屏按图片显示尺寸缩短。原图文件保持不变，中心画面不受覆盖；背景加载和桌面尺寸变化时才重绘，装饰层不接收鼠标事件。可以把自己的图片放入 `assets/`，再修改 `wallpaper` 和 `wallpaperPosition`；CSS 中保留同一默认图片供脚本加载前显示。最新边缘处理及静态预览见 `qa/dithered-wallpaper-edges.md`，4K 接入检查见 `qa/ocean-capsule-4k-wallpaper-integration.md`，显示策略检查见 `qa/wallpaper-contain-layout.md`，首次接入检查见 `qa/ocean-capsule-wallpaper-integration.md`，先前候选和检查记录继续保留。

`explorer.drives` 定义当前驱动器；各项 `id` 应唯一且非空，`letter`、`label` 和 `type` 分别定义盘符、名称和图标类型（`floppy`、`hard-disk`、`cdrom`、`flash-drive`）。`category` 将驱动器关联到作品分类：A 使用 `novel`，G 使用 `game`，H 使用 `utility`；C 不设置分类，因此保持空目录。

将项目加入 `works` 数组即可显示入口，每项填写唯一的 `id`、项目名称 `title`、分类 `category`，以及桌面内路径 `route` 或外部链接 `url`。分类取值为 `novel`、`game` 或 `utility`。`route` 使用相对站点根目录、以斜杠结尾的路径；`id` 使用小写字母、数字及连字符。小说采用文本文件图标，显示名称自动补上 `.txt`（已有该后缀时不重复添加）。游戏使用光盘图标，工具使用工具面板图标。外部 `url` 入口继续在新标签页打开。首次分类及图标检查见 `qa/explorer-project-categories.md`。

当前 A 盘包含 `Story-A.txt`，地址为 `/novels/story-a/`；G 盘包含 `Game-B.exe`，地址为 `/games/game-b/`。普通点击在当前标签页内打开项目窗口，两个窗口均显示“施工中。”，游戏另显示现有光盘图标。修饰键点击和复制链接保留普通链接行为。C、H 盘保持空目录。

项目窗口成为前台时，地址切换到该项目；资源管理器或其他系统窗口成为前台时，地址回到站点主页。开始菜单浮层与窗口最大化不改变地址。最小化保留窗口和状态，关闭移除窗口；两者根据接下来成为前台的窗口更新地址。切换任务栏不会重新创建项目。正式打开新项目增加浏览历史，临时窗口操作替换当前地址；进入下一部新项目之前保留上一部正式访问作品的历史地址，避免资源管理器抢走其后退入口。前进、后退恢复地址所指项目；返回主页会最小化项目窗口。直接访问或刷新项目地址只打开该项目，不恢复整个旧桌面。

`assets/project-routes.js` 负责项目地址，`assets/app.js` 负责窗口状态与占位内容。`novels/story-a/index.html` 和 `games/game-b/index.html` 是从根 `index.html` 生成的共享桌面入口，确保静态托管时项目地址可直接打开和刷新；不要手工修改生成页。修改根 HTML 或配置中的 `route` 后，使用已安装的 Node 执行 `node scripts/generate-project-pages.cjs`，用 `node scripts/generate-project-pages.cjs --check` 检查一致性。入口页通过相对 `<base>` 找到共享资源，运行时将资源根固定为绝对地址，地址变化不会改变图片或脚本位置。

通过 HTTP 预览或部署时使用上述路径地址。直接双击本地 `index.html` 时使用 `index.html#/novels/story-a/` 等片段地址，避免浏览器对本地文件 History API 的路径限制；此模式中的窗口行为相同。检查范围与本地预览方式见 `qa/project-window-routing-demo.md`。音乐播放和完整 JRPG 主题不属于本版。

## 发布

初始预览已由用户接入实际仓库，后续修改在该仓库中进行。上传和发布由用户手工操作。GitHub Pages 可以从 `main` 分支的根目录发布此静态网站；本次本地修改不代表已经推送或上线。

网站运行需要 `index.html`、`assets/` 及生成的项目入口目录（当前为 `novels/story-a/` 和 `games/game-b/`）。`art/` 保存像素资源源码；`docs/`、`qa/`、`scripts/` 和 `project-task-tree.json` 用于维护说明、检查证据与任务记录。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `assets/site-config.js` | 个人内容、菜单文字、默认设置 |
| `index.html`、`assets/app.js` | 桌面结构、菜单与窗口交互 |
| `assets/styles.css`、背景与图标 | 主题、布局和视觉装饰 |

## 验收状态

用户于 2026-09-21 确认 MVP 里程碑已经达到并完成，`QQ Space MVP` 已收尾。完成依据和原遗留项的处置见 [MVP 里程碑收尾记录](qa/mvp-milestone-closure.md)。

用户已查看并认可初始桌面外壳。首次预览检查保留在 `qa/mvp-preview-check.md`，设置窗口与像素 UI 修改的检查见 `qa/system-settings-pixel-ui-review.md`，资源管理器、系统属性及新图标的检查见 `qa/explorer-system-properties-review.md`，窗口缩放和工具栏精简见 `qa/window-interaction-refinement-review.md`。历史报告中的环境与接入状态记录其当时情况；当前状态以任务树和后继报告为准。

用户于 2026-09-23 确认已在网页上测试共用透明度与经典滚动条，结果没有问题；该验收补记保存在 `qa/task-transitions.jsonl`，原检查报告保持不变。

项目进入按需求开发的后续迭代阶段。收到具体需求后，在 `Personal Website` 下建立有明确范围和验收条件的迭代任务；已完成的 MVP 记录保持不变。`Developer Mode` 与 `Chapter Backgrounds` 保留为待明确需求的 `pending` 项，各轮迭代的当前状态以任务树为准。

任务当前状态以 `project-task-tree.json` 为准，`docs/TASK_TREE.md` 由项目脚本生成，不能手工修改。
