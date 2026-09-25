# 小说成品约定 v4

本约定提供给独立小说项目，用于实现自己的发布导出工具。网站 yigrass.github.io 接收最终发布文本与素材，不参与写作、校对、编号或排序。合同标识为 `novel-release-v4`，清单使用 `schemaVersion: 4`。本版固定成品文件层级，替代 v3，不提供旧结构兼容。阅读器公开地址仍为书／卷／章，不增加 text 前缀。

## 成品目录

小说项目在自己的目录导出完整的 `dist/`。成品根目录只包含四项：`text/`、`images/`、`README.md` 和 `release.json`。目录名和 README 文件名区分大小写；固定使用小写 text、images 和大写 README.md。示例：

```text
dist/
├── README.md                         全书介绍，H1 为书名
├── release.json                      当前完整清单及阅读顺序
├── text/
│   ├── case-greedy/
│   │   ├── README.md                 本卷介绍，H1 为卷名
│   │   ├── prologue.md               H1 为章名
│   │   └── ep-05.md
│   └── case-silent/
│       ├── README.md
│       └── ep-05.md
└── images/
    ├── book/
    │   └── sword.png                 全书图标等书级素材
    ├── case-greedy/
    │   ├── prologue/
    │   │   ├── scene.png
    │   │   └── map.webp
    │   └── ep-05/
    │       └── letter.jpg
    └── case-silent/
        └── ep-05/
            └── scene.png
```

`<卷标识>` 和 `<章标识>` 是生产者在清单中提供的 id，不是展示标题。章节固定为 `text/<卷标识>/<章标识>.md`，该章的插图收拢到 `images/<卷标识>/<章标识>/<图片文件名>`；即使只有一张插图，也使用相同层级。没有插图时无需建立对应的卷／章图片目录。图片后缀不限于 .png，可使用浏览器支持的 PNG、JPEG、WebP、GIF、SVG 等格式；文件名和后缀保留原样。

全书图标、封面或全书 README 配图属于书级素材，集中放在 `images/book/`，不挂到任意章节下。卷 README 如有配图，放在 `images/<卷标识>/README/`。`icon` 仍由清单明确指定，建议交付适合缩放的方形 PNG；同一图标用于 A 盘文件、窗口标题、任务栏和目录书名。避免这些书级／卷级素材位置与自行选择的卷章标识产生文件路径冲突，由生产者负责。

## 固定 README 和正文

全书介绍固定读取根目录的 `README.md`；每卷介绍固定读取 `text/<卷标识>/README.md`。这两种 README 均不再在 release.json 中填写路径，Schema 中也没有 readme 字段。章节路径同样由上述目录规则固定，不另填 file 字段。

每本书至少提供一卷，即使全书只有一卷也保留该层级。所有 README 和章节均为 UTF-8 的 `.md` 文件，没有明确另行约定时不交付其他正文格式。章标识不带 `.md` 后缀，导出时加上后缀即可；不要使用 `README` 作为章标识，以免与卷 README 冲突。网站只是按固定约定拼接路径读取，不生成标识、不扫描目录猜测章节，也不检查编号或正文。

## 清单及顺序

清单字段结构以 [release.schema.json](release.schema.json) 为准，Schema 供生产者按需要使用，网站不执行它。最小结构如下，完整两卷五章示例见 [example/release.json](example/release.json)。

```json
{
  "schemaVersion": 4,
  "kind": "novel",
  "id": "sh-tales",
  "icon": "images/book/sword.png",
  "volumes": [
    {
      "id": "case-greedy",
      "chapters": [
        { "id": "prologue" },
        { "id": "ep-05" }
      ]
    },
    {
      "id": "case-silent",
      "chapters": [
        { "id": "ep-05" }
      ]
    }
  ]
}
```

`volumes` 数组本身就是卷顺序，每卷的 `chapters` 数组本身就是章顺序，不需要另填重复的排序数字。上例先读 prologue，再读 ep-05，完全不受文件管理器把 ep-05 排在前面的影响。目录和跨卷前后翻章都使用清单数组顺序。未列入清单的正文不出现在阅读器目录中，但包内文件仍会随成品全部公开，因此源头只应导出准备公开的内容。

书、卷、章的标识均由生产者指定，允许不带数字。每个标识须适合作为 URL 单个路径段及静态文件／目录名，不含路径控制字符，不使用 . 或 .. 作为整段。建议可读的小写字母、数字、短横线，也可以采用合适的非数字名称。网站不修正、重编号、查重或从展示标题推测标识。书标识在站内唯一，卷标识在书内唯一，章标识只需在卷内唯一；这些条件由生产者负责。同名章标识在不同卷下对应不同文件和地址。

| 页面 | 固定源文件 | 公开地址示例 |
| --- | --- | --- |
| 整书介绍 | `README.md` | `/file-explorer/a-floppy-disk/sh-tales/` |
| 卷介绍 | `text/case-greedy/README.md` | `/file-explorer/a-floppy-disk/sh-tales/case-greedy/` |
| 章节 | `text/case-greedy/ep-05.md` | `/file-explorer/a-floppy-disk/sh-tales/case-greedy/ep-05/` |
| 另一卷同名章节 | `text/case-silent/ep-05.md` | `/file-explorer/a-floppy-disk/sh-tales/case-silent/ep-05/` |

## 标题和目录行为

每个 README 和章节应提供表示本页标题的 H1。网站使用 Markdown 解析器找到的第一个 H1 的可见文字；代码块内的 # 不算标题，行内加粗等标记不显示为字面字符。全书 README 的 H1 是书名，卷 README 的 H1 是卷名，章节 H1 是章名。它们与目录名、文件名和标识可以完全不同，清单不重复填写 title。没有 H1 时网站不猜测替代标题，生产者应在导出阶段保证完整。

目录显示书 → 卷 → 章，不单列 README 文件行。点击书名或卷名只打开对应 README，加减号单独负责折叠。长标题单行省略，完整标题保存在悬停提示中。

## Markdown、样式及扩展的边界

网站使用 markdown-it 15.0.2 解析 Markdown，与 VS Code Markdown 预览使用同一种解析核心。解析器负责识别“这是标题、段落、强调、图片、列表或表格”等结构；它不决定字体、字号、行距、边距、配色或窗口外观。本站的这些显示样式由通用 Win95 阅读器提供，没有复制 VS Code 的预览 CSS，也不自动加载生产者机器上安装的 VS Code 扩展。

当前支持标题、段落、强调、引用、多级列表、分隔线、表格、删除线、代码、链接和图片，启用自动链接；关闭原始 HTML、智能标点替换和普通单换行的强制换行。代码块显示等宽文字，没有语法着色。空行分段，强制换行使用 Markdown 硬换行。原始 HTML 作为文字显示，危险链接协议由解析器处理。

公式、Mermaid 图、脚注、自定义容器等增强语法需要相应的插件、脚本或渲染库；当前本站未接入这些能力。VS Code 当前的内置预览已经提供 Mermaid 和基于 KaTeX 的公式显示，但这些同样超出了 markdown-it 解析器本身。VS Code 中某种内容能显示，不表示仅安装 markdown-it 就会自动得到同样效果。每书内部样式配置与新增语法能力以后单独约定，当前成品不携带可执行的自定义阅读器脚本或样式。

VS Code 对样式、markdown-it 插件和预览脚本的划分参见 [官方扩展文档](https://code.visualstudio.com/api/extension-guides/markdown-extension)；其具体预览能力参见 [Markdown 文档](https://code.visualstudio.com/docs/languages/markdown)。

## 图片和正文链接

本站 Markdown 的相对图片和文档链接沿用**成品根目录**为基准的约定，不是当前 .md 文件所在目录。以下片段可写在任意章节中：

```markdown
![海边](images/case-greedy/prologue/scene.png)

![地图](images/case-greedy/prologue/map.webp)

[阅读下一章](text/case-greedy/ep-05.md)

[卷介绍](text/case-greedy/README.md)

[全书介绍](README.md)
```

清单中不再逐张登记图片。Markdown 中的图片引用位置决定展示位置，多张图片不会根据文件夹名自动生成画廊。链接到已发布正文或 README 时，网站转换为相应阅读器页面地址；HTTP(S) 外部链接在新标签页打开。导出工具负责引用正确，网站不检查未引用素材或正文资源链接。

## 发布和接收

导出工具应确定标识与顺序，生成固定位置的各级 README 和章节，整理图片，再写入完整 release.json。根目录始终只有四项，不附带草稿、笔记、缓存或开发代码。生产者可自行使用 Schema 或增加自己的校验；网站不运行小说业务校验器，仅保留文件系统边界保护。JSON 语法错误、缺少必需结构或文件不存在仍会产生正常读取错误；越出成品目录的路径和符号链接会被拒绝。

每章只保留当前发布文件，release.json 始终描述当前完整公开内容。增加第 16 章时，清单仍列出此前 15 章；源头修订或撤下后重新导出整包。接入时将源头 dist 的内容完整复制到网站 releases 下对应成品目录，可以先删除旧成品目录再复制，避免遗留旧文件。网站接收目录名不决定书标识或书名。导出过程不得顺带写入网站；网站构建也不依赖生产者源码位置或执行生产者构建器。

网站保留成品文件原始字节，并生成本次 SHA-256 收据；不另存可阅读的历史章节版本。示例保留两卷五章、跨卷重复 ep-05、非数字 prologue 和第二章长文本，可用于开发导出工具与测试接入。
