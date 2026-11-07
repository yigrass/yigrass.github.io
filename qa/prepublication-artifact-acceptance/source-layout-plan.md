# Source and Release Separation

Project: yigrass.github.io · Task path: Personal Website / Art Untracking and Source Layout Plan · Status: completed · Position: main · Date: 2026-09-23

本文是本轮提交用户审阅的目录迁移计划，尚未实施。已执行的美术文件取消跟踪见 [检查记录](../qa/art-untracking-source-layout-plan/review.md)。当前网站的运行、编辑和发布方式仍以 [README](../README.md) 为准。

## 目标与工具选择

这次迁移一次完成源码归位、应用拆分和发布目录生成。开发文件放在 `src/`，上线图片等素材放在 `assets/`，网站发布文件由脚本生成到 `dist/`。仓库根目录不再存放网站首页和生成的应用入口；公开地址仍由路由配置决定，不随源码所在目录改变。

推荐保留原生 HTML、CSS 和 JavaScript，改用标准 ES modules，并使用项目内的 Node 脚本构建和预览。现有项目规模较小，主要需要模块分离、素材复制和静态入口生成，现有 Node 工具链足以完成。相比引入 Vite 或应用框架，这个方案需要维护少量构建代码，但无需引入依赖、锁文件或框架迁移；若以后出现复杂依赖或明显的打包需求，再单独评估。此次目录整理不以引入框架为前提。

## 目标目录

```text
yigrass.github.io/
├─ src/                              # 人工维护的网站源码
│  ├─ index.html                     # 唯一 HTML 模板
│  ├─ main.js                        # 桌面启动与模块组装
│  ├─ config/
│  │  └─ site.js                     # 个人资料、菜单、磁盘、项目与默认设置
│  ├─ desktop/
│  │  ├─ window-manager.js           # 窗口生命周期、层级、拖动和缩放
│  │  ├─ start-menu.js
│  │  ├─ taskbar.js
│  │  ├─ preferences.js              # 本地偏好读写
│  │  ├─ wallpaper.js                # 壁纸显示和边缘 dithering
│  │  └─ effects.js                  # 光标、星星等桌面装饰
│  ├─ routing/
│  │  ├─ catalog.js                  # 浏览器与构建脚本共用的路由规则
│  │  └─ history.js                  # 前台窗口与浏览器地址、历史同步
│  ├─ apps/
│  │  ├─ my-computer/index.js
│  │  ├─ file-explorer/index.js
│  │  └─ system-settings/index.js
│  ├─ projects/
│  │  ├─ story-a/index.js
│  │  └─ game-b/index.js
│  ├─ themes/presets.js              # 五套预设的唯一颜色定义
│  ├─ shared/dom.js                  # 确实共用的 DOM 辅助函数
│  └─ styles/desktop.css             # 全局主题变量和桌面通用样式
├─ assets/                           # 纳入 Git、复制到发布目录的素材
│  ├─ pixel-ui/
│  └─ wallpapers/
├─ scripts/                          # 构建、预览、任务控制和素材生成工具
│  ├─ build.mjs
│  ├─ dev.mjs
│  ├─ generate-task-tree-doc.ps1
│  ├─ check-task-controls.ps1
│  ├─ generate-scrollbar-arrows.ps1
│  └─ pixel-ui/derive-scrollbar-arrows.lua
├─ tests/                            # 随当前源码维护的自动化检查
├─ docs/                             # 项目说明、设计和生成的任务视图
├─ qa/                               # 历次验收证据，保留原始记录
├─ art/                              # 本地原稿和实验素材，Git 忽略
├─ dist/                             # 自动生成的完整网站，Git 忽略
├─ .github/workflows/pages.yml        # 手动触发的构建、发布流程
├─ .gitignore
├─ package.json                      # private；统一开发命令
├─ project-task-tree.json
└─ README.md
```

应用确有专用样式时，将其放在对应 `src/apps/<app>/` 或 `src/projects/<project>/` 内，通过共享样式入口引用，不再把应用逻辑集中到一份 `app.js`。不提前创建没有用途的空模块。

正式小说内容到来时增加 `content/story-a/`，用于正文、章节和作品元数据；插图等二进制素材放在 `assets/projects/story-a/`。这些目录按实际内容建立，本次只迁移两个已有占位项目，不填充虚构章节或游戏资源。正文与阅读界面分开，使以后更新文本不必改窗口代码。

## 源码职责与现有文件去向

| 当前文件或目录 | 迁移后的职责与位置 |
| --- | --- |
| 根 `index.html` | 移至 `src/index.html`，作为唯一页面模板 |
| `assets/app.js` | 拆为启动入口、桌面组件、应用和项目模块 |
| `assets/project-routes.js` | 转为 `src/routing/catalog.js` 的纯模块；配置继续只保留一份 |
| `assets/site-config.js` | 转为 `src/config/site.js` |
| `assets/themes.js` | 转为 `src/themes/presets.js` |
| `assets/styles.css` | 移入 `src/styles/`，确有必要时拆出应用专属样式 |
| `assets/wallpaper-edges.js` | 接入 `src/desktop/wallpaper.js` |
| 根 `my-computer/`、`system-settings/`、`file-explorer/` | 删除源码树内的生成副本，改由构建写入 `dist/` |
| `scripts/generate-project-pages.cjs` | 静态入口生成功能并入构建流程，移除旧命令入口 |
| `assets/` 中的 PNG 等上线素材 | 保留为资源输入，核对引用后复制到 `dist/assets/` |
| 历史 `qa/` 检查脚本和报告 | 原记录保留；当前回归检查整理到 `tests/` |

窗口管理器统一提供打开、激活、最小化、最大化和关闭行为，应用模块负责窗口内的内容。项目切换和最小化继续保留当前实例；关闭时释放事件监听等资源。Story-A 和 Game-B 各有自己的内容入口，不再在通用窗口代码中增加针对单个作品的条件分支。

路由目录由共享的配置与纯模块生成，浏览器运行和构建使用同一份规则。应用注册集中管理窗口身份与内容模块，避免开始菜单、资源管理器和路由各维护一份互相矛盾的名单。现有磁盘和作品标识保留，公开路径继续使用字面上的应用、磁盘和文件名称。

## 构建产物与公开地址

```text
dist/
├─ index.html
├─ app/                              # src/ 中的 JS、CSS 等运行代码
├─ assets/                           # 上线图片、图标等
├─ my-computer/index.html
├─ system-settings/index.html
└─ file-explorer/
   ├─ index.html
   ├─ a-floppy-disk/
   │  ├─ index.html
   │  └─ story-a/index.html
   ├─ c-local-disk/index.html
   ├─ g-cd-rom/
   │  ├─ index.html
   │  └─ game-b/index.html
   └─ h-flash-drive/index.html
```

发布的是 `dist/` 里面的内容，所以用户访问的仍是 `/my-computer/`、`/file-explorer/a-floppy-disk/story-a/` 等地址，不会出现 `/src/`、`/app/` 或 `/dist/` 这样的页面地址前缀。`/app/` 只是浏览器加载代码资源的路径。同一标签页内的桌面连续运行、多个窗口共存、最小化与任务栏还原、前进后退等规则保持现状。

构建只读取约定的源码和上线素材，生成首页与九个深层入口，并验证重复路由、输出路径和本地资源引用。生成页通过统一资源根引用同一套代码，保证直接访问、刷新和桌面内切换都有效。未来正文作为明确的内容输入单独复制，不能把整个仓库当发布输入。

`dist/` 不纳入 Git，也不手工修改。重新构建只清理经过绝对路径和目录链接检查的项目内 `dist/`；不能清理 `src/`、`assets/` 或 `art/`。发布内容不含 `art/`、`docs/`、`qa/`、`scripts/`、任务控制文件或 Git 元数据。网站构建不调用 Aseprite，也不读取任何本地原稿；箭头派生图仍通过专用素材命令更新并保存到 `assets/`。

## 开发和发布方式

迁移后用 `npm run dev` 启动仅监听本机的预览服务，先构建后提供 `dist/`；监听源码和素材变化后重新构建，浏览器可手动刷新。`npm run check` 运行当前源码检查与任务控制检查，`npm run build` 生成正式产物。Windows 中使用 `npm.cmd` 避免 PowerShell 执行策略拦截。项目会声明所需 Node 版本，不将某台电脑的安装路径写成构建依赖。

采用 ES modules 后不再支持双击 `index.html` 的 `file://` 预览；本地统一通过 HTTP 服务预览。相应的片段地址回退代码也会删除。这是本次计划中的明确破坏性变更，不影响正式网站地址，不新增兼容层。

从仓库根目录直接发布的旧方式需要同步调整，否则源码迁走后根目录不会再有网站入口。建议准备 GitHub Pages 的自定义 Actions 工作流：用户手动触发构建，将 `dist/` 作为 Pages artifact 发布，不需要把产物提交到 Git。工作流采用 `workflow_dispatch`，不配置 push 自动发布。关于上传指定产物目录，参见 [GitHub Pages 自定义工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

代理只准备本地工作流文件和操作说明。推送、Pages 设置变更和工作流触发均由用户手工完成。本轮没有检查或修改远端发布设置；迁移验收时也须明确区分本地构建通过与网站已经上线。

## 一次迁移的实施顺序

1. 保存当前路由、交互和素材摘要作为基线，保留用户未提交的修改，明确完整写入范围。
2. 把 HTML、配置、样式和脚本迁入 `src/`，当轮完成桌面、应用和两个项目的拆分，并将共享模块改为显式导入。
3. 实现构建与预览命令，由共享路由目录生成 `dist/`，核对所有脚本、样式、图片和深层页面的资源根。
4. 整理当前回归检查，更新 README，增加 `/dist/` 忽略规则和手动发布工作流；删除失去用途的旧源码入口与旧生成命令。
5. 对真实构建产物验收，提交本地检查记录和需要用户手工执行的发布步骤。Git 暂存、提交与任何远端操作仍须遵循用户的具体授权。

## 验收标准

- 不依赖 `art/` 或 Aseprite 的新检出目录也能完成构建；`dist/` 只包含约定的网站文件。
- 首页与九个深层入口均能从 HTTP 直接打开和刷新；公开地址不变，代码和素材全部正常加载。
- Story-A、Game-B 与系统应用可同时存在；聚焦、最小化、还原、关闭、前进后退仍符合既定窗口与地址规则。
- 五套主题、透明度联动、20 像素滚动条、窗口拖动缩放和窄屏布局保持正常。
- 壁纸及像素图标字节不变，完整显示、深灰填充和 dithering 保持原效果。
- 任务控制生成与检查通过；历史报告不被改写；实际浏览器验收与程序检查分别记录。

## 后续功能开发位置

新增系统应用时，在 `src/apps/<app>/` 编写界面并接入统一注册；修改窗口机制时只改 `src/desktop/`，所有应用共用。新增作品时，在 `src/projects/<project>/` 添加内容模块，在配置中指定磁盘、文件名和地址名；页面入口随构建生成，不手写一套新的桌面 HTML。多个小说出现共用阅读需求后，再抽出阅读器模块，正文继续独立保存。

自定义主题在系统设置模块内实现编辑界面，配色定义与应用机制归主题模块；不让单个应用各自处理系统主题。游戏运行所需的暂停、恢复和资源清理由项目模块接入窗口生命周期，具体规则在实际游戏需求到来时确定。这样的拆分为当前需求提供明确位置，同时不提前建设没有需求的插件系统或游戏引擎。
