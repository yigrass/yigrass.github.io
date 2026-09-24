# Architecture

本文件描述当前架构。最初的 [Source Layout Plan](SOURCE_LAYOUT_PLAN.md) 保留讨论历史；用户之后明确了独立作品只接收成品，以及小说只保留当前发布内容。本次实现采用这些后续决定。

## 目录与单一职责

```text
src/
  index.html                  唯一桌面模板
  main.js                     加载作品目录、启动桌面
  config/site.js              个人信息、菜单、磁盘、默认偏好
  desktop/                    窗口管理、任务栏、开始菜单、偏好、背景
  routing/catalog.js          应用、磁盘、作品的公开路径规则
  routing/history.js          前台窗口与浏览历史同步
  apps/my-computer/           个人系统属性
  apps/file-explorer/         虚拟目录浏览
  apps/system-settings/       主题与显示设置
  apps/project-viewer/        通用文本阅读器与网页成品窗口
  themes/presets.js           预设配色权威定义
  shared/dom.js               公共 DOM 辅助函数
  shared/novel/               小说文档索引及安全 Markdown DOM 渲染
  styles/desktop.css          主题变量、桌面和应用样式
catalog/projects.json         作品在网站中的身份与接入位置
releases/<id>/                独立作品的当前发布成品
assets/                      网站自己的上线图片
contracts/novel-release-v2/   可独立复制的小说成品合同及 Markdown 解析定义
scripts/                     构建、预览、检查、素材工具
tests/                       随源码维护的当前回归测试
docs/                        维护文档和生成任务视图
qa/                          不改写的历次验收记录
art/                         忽略的本地原稿，不参与构建
dist/                        忽略的完整发布产物
```

网站中没有按作品划分的开发源码目录。小说项目负责写作、修订和导出，游戏项目负责玩法、资源和自己的构建。网站依赖接收后的成品字节，不依赖生产项目所在盘符、源码目录、开发分支或构建工具。修改作品内容须回到源头，再重新接入最终成品。

网站目录决定虚拟磁盘、文件名与作品地址，作品自己的 release.json 决定小说图标、书名、卷别和文档内容。小说 manifest 规则以 [合同](../contracts/novel-release-v2/README.md) 及其 Schema、校验器为准；本文件不另列一套字段规则。构建由已校验成品生成运行时目录中的 iconPath 和 reader 索引，不在手写 catalog/projects.json 重复登记章节。小说根 README、各卷 README 和实际章节共享同一个窗口实例。

用户明确批准小说只保留当前正文和一份 release.json，可在接收源头修订导出后整套替换，不保留版本目录。构建生成本次文件的 SHA-256 收据，提供对实际字节的识别，不构成历史发布库。独立项目之间不自动相互写入：源头只导出自己的 dist，接入网站是单独步骤。

## 窗口与内容生命周期

window-manager 管理位置、尺寸、前台层级、最小化、最大化和关闭；应用渲染器只提供窗口内容。窗口内容可返回 dispose、setVisible 和 ready；关闭时取消正在读取的内容并清理监听，最小化保留实例、当前章节和滚动位置。作品展示器另提供 getDocumentId 和 navigateDocument，供桌面统一路由。文档读取使用请求序号避免旧响应覆盖新选择，Markdown 先解析为受限节点，再通过 createElement / textContent 构造 DOM，不使用 innerHTML。

Markdown 的唯一语法实现位于合同 markdown.mjs，校验器直接调用它检查图片与文档引用。构建将同一模块原样复制为 dist/app/shared/novel/markdown-profile.js，浏览器 DOM 渲染器导入该文件；不在源码维护两套解析规则。包内引用以成品根目录为基准，站内文档链接转为桌面章节地址，外部 HTTP(S) 链接使用新标签页。未支持的 HTML 和危险链接按普通文本显示。

阅读器目录以清单顺序渲染，README 在所属层级最前面；节点折叠与文档选择分开处理。边缘箭头使用现有 back/forward 图标及 CSS 一秒淡出；全局方向键只在该阅读器窗口处于前台、开始菜单关闭且未编辑输入控件时生效。ResizeObserver 根据阅读区高度更新末尾留白，使最后一行可以滚至顶部；关闭时释放观察器及全局事件。

网页作品通过 iframe 嵌入自己的 HTML，不与桌面共用 CSS。该模式用于信任的自有成品，不承诺同源脚本安全隔离。框架允许脚本、同源能力、指针锁定和全屏；更具体的浏览器权限或外部服务在实际作品接入时评估。

窗口隐藏和恢复发送 `{ type: "desktop-visibility", visible: boolean }`，游戏是否暂停由成品自身实现；初次页面加载也收到当前可见状态。作品实现消息处理时应检查发送方 origin 和 source。普通聚焦切换不等同于最小化，不会强制暂停后台可见窗口。关闭 iframe 销毁运行实例，持久存档由作品自身负责。嵌入网页若自行执行文档导航，可能影响浏览器历史；真实游戏接入需验证其导航与桌面规则相容。

窗口与 History API 的连接在 desktop/bootstrap.js 中组装。正式导航增加历史，临时聚焦更新当前地址，同时保留上一次正式访问记录。路由规则由浏览器和构建共用 catalog.js，不维护第二份页面列表。静态入口中的 base 指向站点根，运行时在地址变更前固定该资源根。

## 构建与部署

build.mjs 读取网站源码、网站素材、作品目录以及目录中登记的成品。先校验所有输入，再写入项目内 .dist-build 暂存目录；检查代码与样式引用后替换 dist。失败校验保留旧的有效 dist。生成目录的绝对路径必须是项目的直接子目录，不接受目录链接；输入目录中的符号链接也会被拒绝。

源码输出到 dist/app，素材到 dist/assets，派生后的作品目录和成品保留在 dist/catalog、dist/releases。首页及各应用、磁盘、作品、卷 README 和章节入口由同一模板生成。合同只有共享 Markdown 解析模块作为构建输入复制到 app；合同文档、Schema、校验器和示例不发布。art、docs、qa、tests、scripts、任务控制及 Git 元数据不发布。不存在仅将源文件移到 src、仍从仓库根直接发布的中间模式。

dev.mjs 仅监听 127.0.0.1，并只提供 dist 内容。修改约定输入时重新构建；没有开发服务器专用的深层路由回退，预览直接使用实际静态入口，以便尽早发现静态部署问题。

Pages 工作流仅通过用户手动触发。用户须在远端将 Pages Source 设为 GitHub Actions；工作流从已推送的输入运行检查与构建，上传 dist 部署，不将 dist 提交到 Git。工作流尚未由代理在远端运行，远端验收归用户操作。

## 扩展方式

新系统应用在 src/apps 添加渲染器并接入桌面注册；新的作品只提供最终成品和目录登记。多个作品共用的阅读或展示能力放在通用展示器里，某个游戏的玩法代码不得移入网站源码。新增成品类型需要先补充合同、校验和通用加载器，再接收实际作品。

新小说章节有各自的静态公开地址，但不产生新的桌面窗口。选择章节或 README 增加正式访问历史，前进后退在同一小说窗口恢复目标文档；聚焦及最小化继续遵循桌面地址规则。刷新章节地址直接打开这一章，目录展开到其所属卷。每书视觉配置和个性化模板、跨刷新阅读进度仍留待后续需求，当前不接收任意样式或脚本配置。
