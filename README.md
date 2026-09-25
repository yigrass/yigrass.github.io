# yigrass.github.io

Meet me here.

这是一个以 Windows 95/98 桌面为视觉参考的个人网站。使用原生 HTML、CSS 和 JavaScript ES modules；Node 构建生成完整静态网站。网站只开发桌面与通用展示功能，小说、游戏和工具在各自项目中开发，这里接收最终发布成品。

## 开发和检查

需要 Node.js 24 或更新版本及 PowerShell 7（完整检查使用项目已有的任务控制脚本）。首次使用或更新依赖后执行 npm ci，按 package-lock.json 安装固定版本的 markdown-it 和构建工具 esbuild。Windows PowerShell 中使用 npm.cmd；其他环境使用 npm。

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run dev
npm.cmd run check
npm.cmd run build
```

预览地址为 `http://127.0.0.1:4173/`，只提供 `dist/` 内容。修改源码、目录配置或成品后自动重新构建，刷新浏览器查看；若构建失败，控制台显示错误并保留之前的有效产物。换端口可运行 `npm.cmd run dev -- --port 4174`。不再提供直接双击 HTML 的 file:// 预览或旧片段路由。

`check` 检查源码语法、成品接入行为、真实构建产物、桌面交互和任务控制。桌面自动化用例通过模拟 DOM 执行实际模块，不代替真实浏览器的布局与视觉验收。`test` 是同一完整检查的入口。`build` 读取成品、构建索引并重建 `dist/`，不会自动执行 Git 操作或发布，也不执行小说业务校验。

## 目录边界

| 目录 | 内容 | Git / 发布 |
| --- | --- | --- |
| `src/` | 网站 HTML 模板、桌面、系统应用、路由、主题和通用作品展示器 | Git 管理；代码进入 `dist/app/` |
| `catalog/projects.json` | 所属磁盘、成品位置及非小说作品的显示信息 | Git 管理；构建派生完整目录 |
| `releases/<project-id>/` | 从独立项目接收的完整当前成品 | Git 管理；构建按目录接入 |
| `assets/` | 网站自身的壁纸、系统图标等素材 | Git 管理；构建复制 |
| `contracts/novel-release-v3/` | 可带到小说项目使用的成品约定、生产者用 Schema 和示例 | Git 管理；不参与构建、不发布 |
| `node_modules/` | 根据锁文件安装的开发依赖 | 忽略；只将阅读器所需代码打包进 dist，并保留许可证 |
| `art/` | 本地美术原稿和实验文件 | 忽略；不参与构建 |
| `dist/` | 自动生成的完整静态网站 | 忽略；发布此目录中的内容 |
| `scripts/`、`tests/`、`docs/`、`qa/` | 工具、当前检查、维护说明和历史验收记录 | Git 管理；不发布到网站 |

完整结构和代码职责见 [Architecture](docs/ARCHITECTURE.md)。[初始目录计划](docs/SOURCE_LAYOUT_PLAN.md) 保留当时讨论，其 `src/projects/`、根 `content/` 设计已被后续明确的独立成品接入边界取代。实际结构以 Architecture 和当前源码为准。

`art/` 已停止 Git 跟踪，本地内容保留；原稿需要另行备份。忽略规则不会清除既有 Git 历史。网站构建不读取 art，不运行 Aseprite，也不访问相邻作品的开发目录。

## 编辑网站和接入作品

`src/config/site.js` 配置个人资料、菜单文字、磁盘、默认设置和壁纸。`src/themes/presets.js` 是主题颜色的唯一编辑入口，公共样式在 `src/styles/desktop.css`。系统应用分别位于 `src/apps/my-computer/`、`file-explorer/`、`system-settings/`，通用作品展示器位于 `src/apps/project-viewer/`。

作品登记在 `catalog/projects.json`。内部 `category` 取 novel、game 或 utility，用来选择接入类型，不出现在公开地址中。小说只登记 category、driveId 和 release；书标识由成品清单提供，书名从整书 README 的 H1 读取，磁盘显示时加上 .txt。非小说作品继续在目录登记 id、完整显示文件名 title、所属磁盘 driveId、地址段 slug 和成品位置 release。release 指向 releases 下的当前成品目录。外部链接用 url 代替 slug 和 release，在新标签页打开。

当前 A 盘的桑海志怪.txt 是两卷五章的虚构演示作品，第二章为长文本，另有整书和两卷的 README；使用生产者提供的 sh-tales、case-01/case-02 和卷内章节标识。Game-B.exe 仍是“施工中。”网页成品演示。新增作品时提供成品并登记目录，构建自动生成桌面入口，不手写新的桌面 HTML，也不把其他项目的开发源码放进 src。

小说成品规则见 [Novel Release Contract v3](contracts/novel-release-v3/README.md)。源头项目按约定导出自己的 dist；将其内容完整接入 releases 下的对应目录。追加、修订、撤下均在源头处理后重新导出。可以先删除网站中该小说的成品目录再整目录复制，或使用自行编写的替换工具；不能留下旧版本多出的文件。网站不提供小说校验器或自动导入命令，标识、排序、H1 标题及内容正确性均由生产者负责。旧合同只保留历史交付 ZIP，不再参与运行。

通用阅读器采用目录和正文双栏，目录通过贴在细分隔线右侧、顶部齐平的 20px 梯形页签收起或展开，窄屏默认收起。目录默认宽 220px，可拖动细分隔线调整；两栏最小值和分隔线宽度统一定义在 src/apps/project-viewer/reader-layout.js。关闭后重开恢复默认宽度，最小化不重置。目录长标题单行省略，按钮、选中高亮及悬停虚线随内容收紧。书名和卷名直接打开对应 README，加减号单独折叠；README 不再作为文件行出现。作品图标来自成品，在 A 盘、标题栏、任务栏和目录书名处共用；当前卷别和章节图标集中在 novel.js 的 treeIcons，等待后续替换。

正文使用 markdown-it 解析，支持表格、多级列表等语法，按桌面主题排版；依赖已打包在本站，访客不连接第三方 CDN。标题栏下保留“文件”“查看”占位菜单及无文字前后翻章按钮，默认左右方向键也可跨卷翻章。正文能滚动到最后一行位于顶部。状态栏显示书名、卷名、章名和大致阅读百分比，使用带空格的 ASCII 竖线分隔；百分比按视口底部相对正文高度计算，不计末尾滚动留白。阅读区阻止普通选中和复制快捷键，仅作为最低限度门槛，公开 Markdown 仍可被获取。书签、用户显示偏好、自定义快捷键、目录宽度记忆与每书视觉配置留待后续开发。

构建按清单原样读取标识与数组顺序，不猜测或校验编号，不按标题或文件名排序。它保留文件系统边界保护；缺失文件、不可读取的结构或非法 JSON 会产生正常读取错误。包内文件全部复制，包括未引用文件。当前成品的 SHA-256 清单自动写入 dist/release-integrity.json；这是本次部署的内容摘要，不是章节历史版本目录。用户已明确允许小说成品整套替换；Git 历史仍遵循普通提交行为。

网页成品当前通过 release.json 的 `schemaVersion: 1`、`kind: web`、id、title 和 entry 登记；entry 指向包内 HTML。图片、脚本、样式等应在该成品目录内，并适应子目录部署。构建保留其字节，不运行该项目的构建器。窗口内 iframe 保留独立页面布局，嵌入自己信任的作品；它不构成同源代码之间的安全隔离。隐藏和还原时发送 desktop-visibility 消息，作品自行实现暂停、恢复；网站不能保证任意游戏自动暂停。需要后端服务的作品须另外部署后端。

## 桌面行为和地址

初始桌面只有背景与任务栏。开始菜单可打开我的电脑、资源管理器和系统设置；再次点击开始按钮、点击菜单外或按 Escape 可关闭菜单。我的电脑保留常规、个人介绍和联系信息三个页签。当前只有已知昵称 yigrass 和签名 Meet me here.，其他资料等待填写。

资源管理器使用 A: 3.5 英寸软盘收纳小说、G: 光盘驱动器收纳游戏、H: 闪存盘收纳工具；只保留一个空的 C: 本地磁盘。这些是虚拟目录，不读取访客设备。界面显示磁盘与文件名称，C、H 当前为空。关闭资源管理器后重新打开会回到根目录，最小化后还原则保留所在磁盘。

| 位置 | 地址 |
| --- | --- |
| 我的电脑 | `/my-computer/` |
| 系统设置 | `/system-settings/` |
| 资源管理器 | `/file-explorer/` |
| A 盘 | `/file-explorer/a-floppy-disk/` |
| C 盘 | `/file-explorer/c-local-disk/` |
| G 盘 | `/file-explorer/g-cd-rom/` |
| H 盘 | `/file-explorer/h-flash-drive/` |
| 桑海志怪.txt / 整书 README | `/file-explorer/a-floppy-disk/sh-tales/` |
| 第一卷 README | `/file-explorer/a-floppy-disk/sh-tales/case-01/` |
| 第一章 | `/file-explorer/a-floppy-disk/sh-tales/case-01/ep-01/` |
| Game-B.exe | `/file-explorer/g-cd-rom/game-b/` |

前台窗口及其当前文档决定页面地址。开始菜单浮层和最大化不改变地址；最小化保留实例，关闭移除实例，两者按照下一个前台窗口更新地址，没有可见窗口才回到主页。任务栏切换不重建窗口，保留小说所选章节和滚动位置。正式打开新应用或项目、选择章节或 README、进入磁盘或向上返回增加浏览历史；聚焦、最小化和还原替换当前地址，并保留正式导航的后退入口。前进、后退恢复对应窗口和文档，返回主页会最小化全部窗口。直接访问或刷新深层地址只打开对应窗口及所选章节，不恢复整个旧桌面。

宽屏支持标题栏拖动和四边、四角缩放；最小化及最大化还原保留本次尺寸，关闭再开恢复默认尺寸。窄屏窗口占据主要内容区，边框缩放停用。窗口状态不跨刷新保存。

## 主题与素材

系统设置提供五套预设：95's、95's（异化，默认）、深渊、苔痕和幽涧。选中后同步更新窗口、开始菜单、任务栏、按钮和滚动条；预设与自定义折叠项保留，自定义仍为灰色“功能开发中”。设置显示控件背景、内容背景和标题栏的 RGB 色值及色块。开始菜单与任务栏共用底色透明度，其他设置包括像素光标和漂浮星星；浏览器允许时保存偏好，减少动态效果的系统偏好会停用星星动画。

壁纸、深灰填充和 dithering 不随主题改变。当前背景为 assets/wallpapers/industrial-gray.jpg，3840×2160，采用 contain 完整居中显示，阴影填充 #2d2f2d。src/desktop/wallpaper.js 仅在显示层添加 2 CSS 像素的有序抖动边缘，原图字节不变。

横竖滚动条均为 20 像素，四个箭头按钮均为 20×20，状态栏保留 25 像素。箭头唯一图像编辑入口是 assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png；修改后运行 scripts/generate-scrollbar-arrows.ps1，通过既有 Aseprite 启动器生成旋转及禁用版本。工具代码位于 scripts/pixel-ui/，不依赖 art；网站构建无需 Aseprite。

## 发布

仅发布 dist 内的内容，公开地址不增加 dist 或 src 前缀。GitHub Pages 原先从分支根目录发布的设置需要由用户改为 GitHub Actions，否则新结构不会按预期上线。

用户提交并推送本地修改后，在仓库 Settings → Pages 中将 Source 设为 GitHub Actions；再到 Actions 手动运行 Publish desktop website。工作流先通过 npm ci 安装锁定依赖，再检查、构建并上传 dist 部署。它只有 workflow_dispatch 触发，不配置 push 自动发布；无需把 dist 提交到 Git。工作流位于 .github/workflows/pages.yml，机制参见 [GitHub 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

代理只准备和检查本地文件，远端设置、推送与发布由用户手工处理。本次本地构建通过不代表远端已发布。

## 开发约定与任务状态

除用户另有说明，后续迭代允许破坏性变更，不保留旧地址、接口或数据结构的兼容层。变更同步更新使用处并删除旧入口；这不扩大 Git 写操作、远端操作或无关文件的授权。

MVP 已由用户于 2026-09-21 确认完成，记录见 [MVP 里程碑收尾](qa/mvp-milestone-closure.md)，后续按需求迭代。用户于 2026-09-23 确认共用透明度与经典滚动条的网页测试没有问题。历史验收记录保留各自当时的实现与限制，新的目录迁移记录见 [Source and Release Separation](qa/source-release-separation/review.md)。

当前任务以 project-task-tree.json 为准，qa/task-transitions.jsonl 只追加历史，docs/TASK_TREE.md 必须由 scripts/generate-task-tree-doc.ps1 生成。Developer Mode、Chapter Backgrounds 和 Custom Themes 保留为待明确需求的任务。
