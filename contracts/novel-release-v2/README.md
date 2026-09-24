# 小说成品约定 v2

Contract ID: novel-release · Schema version: 2 · Consumer: yigrass.github.io · Date: 2026-09-24

将本目录整体交给小说开发项目，用于制作导出工具。小说项目负责写作、修改、选择公开内容并生成自己的 dist；网站只接收完整当前成品，提供通用阅读器。v2 使用 Markdown 正文、整书与卷别 README、卷内章节和作品图标；网站不再接收 v1 的 TXT 成品。

## 成品结构与当前发布

每次导出都是一份自包含的完整当前成品。只有一个 release.json，每篇正文只有当前文件；无需章节历史版本、publications 目录或增量操作日志。发布第 16 章时，清单和目录应包含完整的当前 1～16 章。正文修订在源头进行，重新导出后整套替换网站接收目录；撤下的内容和图片也要从新成品移除。

```text
dist/
├─ release.json
├─ README.md
├─ volumes/
│  ├─ volume-1/README.md
│  └─ volume-2/README.md
├─ chapters/
│  ├─ chapter-1.md
│  └─ chapter-2.md
├─ images/
│  ├─ sword.png
│  └─ scene.png                    # 可选，正文实际引用的插图
├─ LICENSE.txt                     # 可选，许可声明，不是阅读正文
└─ NOTICE.txt                      # 可选，素材署名，不是阅读正文
```

正文实际文件位置可以由生产项目组织；上面是推荐结构。清单中的 file 指向包内真实路径，所有阅读正文（包括整书与每卷 README）只接收小写扩展名 `.md`，UTF-8 编码。允许 UTF-8 BOM、LF、CRLF 或 CR 换行，不接受空正文或 NUL 字符。LICENSE.txt 和 NOTICE.txt 只是可选的法律与署名文件，不进入阅读目录。

交付网站时复制 dist 的内容到 `releases/<id>/`，例如 `releases/story-a/release.json`，不要多包一层 dist。生产者的正常导出命令只能写自己的输出，不主动写网站仓库，不依赖网站源码所在盘符，不执行网站 Git 或部署操作。

## 清单与目录树

字段规则以 [release.schema.json](release.schema.json) 为权威来源，跨字段和实际文件检查由 [validate.mjs](validate.mjs) 执行。完整可运行样例见 [example/release.json](example/release.json)。下面是最小结构示意：

```json
{
  "schemaVersion": 2,
  "kind": "novel",
  "id": "example-book",
  "title": "示例小说",
  "status": "ongoing",
  "icon": "images/sword.png",
  "readme": { "file": "README.md" },
  "volumes": [
    {
      "id": "volume-1",
      "title": "第一卷 · 雾渡",
      "readme": { "file": "volumes/volume-1/README.md" },
      "chapters": [
        { "id": "chapter-1", "title": "第一章 · 借火", "file": "chapters/chapter-1.md" }
      ]
    }
  ]
}
```

`schemaVersion: 2` 是成品格式版本，不是作品发布次数。kind 固定为 novel；id 是作品的稳定标识，须与网站登记一致。title 是正式书名，不含文件后缀。status 取 ongoing 或 completed。author、description、language 为可选说明，目前不保证在阅读器中展示全部说明。

小说至少有一卷，每卷至少有一个公开章节；只有一卷的小说也使用 volumes 数组。卷按 volumes 数组顺序排列，各卷章节按 chapters 数组顺序排列，网站不根据文件名、id 或中文标题重新排序。顺序由生产项目明确提供。

整书 readme 和每卷 readme 都是必填。阅读器在小说节点下先显示整书 README.md，再显示各卷；每卷下先显示该卷 README.md，再显示实际章节。README 的界面名称固定为 README.md，实际正文路径由 file 指定。点击书名或卷名时读取其 README 并切换展开状态；点击旁边加减号只切换展开状态；点击 README 条目或章节直接读取正文。

卷和章节 id 都是公开地址段，必须在全书范围内共同唯一，采用小写字母开头的小写字母、数字和连字符。章节 id 在增补或调整卷序时应保持稳定，不必与当前排序数字相等。两个 README 或章节不能引用相同的正文文件。修订时保留相同 id 和 file，重新导出正文即可。

网站登记的作品地址假设为 `/file-explorer/a-floppy-disk/story-a/`：整书 README 使用该地址；卷 README 使用 `.../story-a/volume-1/`；章节使用 `.../story-a/chapter-1/`。README 文件条目与相应书名、卷名访问同一个地址，不产生重复页面。章节按全书章节序列翻页，跨卷连续；README 不计入章数。

## 作品图标

icon 必须指向包内 images 下的方形 PNG，边长接受 16、32、48 或 64 像素。建议透明背景、清楚的像素轮廓。A 盘图标、小说窗口标题、任务栏以及书名树节点都使用这一份图片，网站仅调整显示尺寸，不另画不同版本。作品项目可选择自己的图标；示例宝剑可复用，注明其来源即可。

卷别的打开、合上书本图标，README 的信息图标和章节的 TXT 文件图标由网站统一提供，不用放入作品包。TXT 是界面图标样式，不表示正文需要转换成 .txt。

## Markdown 范围

第一版支持：`#` 至 `######` 标题、空行分段、`**加粗**`、`*斜体*`（也可使用下划线）、行内反引号代码、反引号或波浪线围栏代码块、`>` 引用、单层有序与无序列表、分隔线、行内链接和图片。段内普通换行按自然段排版合并，行末两个空格加换行可显式换行。建议一个自然段占一个物理行，段间空一行。网页不会自动添加或删除章标题；建议每篇 Markdown 以一个一级标题开始。

这是适合正文阅读的明确子集，解析行为以 [markdown.mjs](markdown.mjs) 为准；不是完整 CommonMark 或 GFM 实现。暂不支持 front matter、表格、脚注、任务列表、引用式链接、嵌套列表和任意扩展语法。请在导出阶段转换成支持的表达形式，不要假设扩展能正确排版。HTML、脚本及不安全网址均按普通文字显示，不执行。此版本不接收自定义 CSS、JavaScript、字体或读者设置字段。

链接和图片的包内地址**统一相对于 release.json 所在目录**，不相对于当前 Markdown 文件；导出工具应重写源稿中的相对引用。例如深层卷 README 中仍写 `[第一章](chapters/chapter-1.md)`。站内链接只能指向清单已登记的 Markdown 文件，阅读器转换为对应独立页面地址，并在原窗口导航。外部链接只支持显式的 https 或 http，点击时在新标签页打开。

插图直接写入 Markdown，例如 `![海边的灯塔](images/scene.png)`，不使用旧版 illustrations / afterParagraph 字段。必须写非空替代文字，图片须是包内 PNG、JPEG（.jpg 或 .jpeg）或 WebP，不能使用远程图片。允许多处引用同一张图片，正文中的位置决定显示顺序。网站保持原始字节，仅按阅读区域等比显示。

第一版全书共用默认字体、字号、行距和边距，跟随桌面主题。以后可扩展每本小说的内部排版配置，这不等于给终端读者增加设置界面；目前不接受自定义配置字段。目录可整体收起，窄屏默认收起。正文末尾允许继续滚动，直到最后一行到达阅读区顶部。

## 文件边界和检查

路径使用正斜杠、ASCII 字母数字及点、连字符、下划线，每段以字母或数字开头。推荐路径全部小写，README.md 可保留大写名称。禁止绝对路径、盘符、反斜杠、网址、查询参数、百分号、`.` 或 `..` 路径段、尾随点、Windows 设备名、大小写重名以及符号链接和目录联接。图片路径以 images/ 开头，扩展名小写。

仅接收 release.json、清单登记的 Markdown、作品图标、正文实际引用的插图以及可选 LICENSE.txt 和 NOTICE.txt。未登记的草稿、撤下章节、闲置素材、源码、导出日志和原稿均会导致校验失败。发布包所有文件都视为可公开，不通过“界面里看不到”来隐藏内容。图片检查包括签名与图标尺寸，不能替代源头的完整解码和视觉检查。

本目录的校验器需要 Node.js 24 或更新版本，无第三方依赖，不联网，不修改输入。将整个目录复制到小说项目的 tools/novel-release-v2 后运行：

```powershell
node tools/novel-release-v2/validate.mjs ./dist example-book
```

将 example-book 换成作品 id。成功返回 0 和 JSON，包含卷数、章数、清单、各文件字节数与 SHA-256 及整包摘要；失败返回非零和具体原因。日志应保存到 dist 外。测试随附的两卷五章完整成品：

```powershell
node validate.mjs ./example example-book
```

生产工具应在自己的暂存目录组装完整成品，校验通过后才替换自己的 dist；网站接收时再独立校验。追加、修订和撤下都导出完整当前内容，复制时整个替换接收目录，避免旧文件残留。网站再生成自己的发布 dist，作品项目不承担网站部署。网站不保留可阅读的章节历史，但 Git 历史仍按普通提交行为保留。
