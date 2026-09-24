# Novel Reader Template

Project: yigrass.github.io · Task path: Personal Website / Novel Reader Template · Active task: Novel Reader Template · Status: completed · Position: main

Started: 2026-09-23. Completed: 2026-09-24. Parent: Personal Website. Return point: Personal Website / Review novel reader template.

## 交付

通用小说阅读器采用可收起目录的双栏布局，移除了顶部章节选择器和带文字翻页栏。目录按整书、卷、章节排列，各层 README 优先显示；点击书名或卷名读取相应 README 并切换展开状态，小加减号只控制展开。卷图标有开合两态，章节使用既有 TXT 文件图标，README 使用新的像素信息气泡。窄屏默认收起目录。

成品里的作品图标在磁盘列表、窗口标题、任务栏及书名树节点共用。新增 16×16 宝剑、开合书本和信息图标，使用已安装 Aseprite 的隔离启动器生成，不改动旧图标和壁纸。编辑源保存在本目录 icons 下，绘制脚本为 draw-icons.lua，运行时素材在 assets/pixel-ui/v1.4.0；演示作品自带宝剑 PNG。图标逐像素透明度、尺寸、帧数、解码及复制摘要检查见 icon-validation.json。

演示作品为 A 盘的桑海志怪.txt，沿用 story-a 地址。第一卷三章、第二卷两章，另有整书及两卷共三个 README；第二章《夜航簿》是长文本，其余各章为不同的短篇。它们都是本次虚构的演示文稿，不代表用户真实小说的已发布内容。

章节有独立静态地址，例如 `/file-explorer/a-floppy-disk/story-a/chapter-2/`；整书 README 使用作品根地址，卷 README 使用 volume-1、volume-2 地址。切换章节仍使用同一窗口，浏览历史、最小化还原和多个作品窗口的行为保持连贯。边缘翻页箭头默认隐藏，靠近边缘出现，移出后一秒淡出；左右键在前台阅读器中翻章，开始菜单打开或焦点在输入控件时不接管。翻页跨卷连续并跳过 README。触屏因没有悬停，保留淡色箭头；减少动态效果偏好停用淡出动画。

正文末尾留出随阅读区域高度变化的空白，可以将最后一行滚至顶部。阅读器先使用统一默认字体、行距和边距；每书内部配置和个性化阅读器作为后续任务记录，本轮未加入读者设置。

## 成品合同

活动合同升级为 contracts/novel-release-v2，正文和所有 README 只接受 UTF-8 Markdown。清单必须声明小说图标、整书 README 和至少一卷，每卷包含 README 和至少一章；顺序由数组决定，卷和章节路由 id 共同唯一。只保留一份当前 release.json 和当前正文文件，源头完整导出，网站整套接收。v1 活动目录及构建入口已移除，首次合同交付的历史 QA 与 ZIP 保留原样。

Markdown 采用合同明确列出的正文子集，无第三方运行依赖。权威解析模块与独立校验器放在同一个合同目录，网站构建将该模块原样复制为运行时模块；没有两份维护中的解析规则。渲染使用 DOM / textContent，不执行 HTML 或危险链接。成品链接以包根为基准，站内 Markdown 引用转换为桌面文档地址。合同包含 Schema、校验器、解析定义、中文规则和两卷五章完整例子。

可携带 ZIP 为 novel-release-v2.zip，共 14 个文件。原目录和实际解压文件逐一核对 SHA-256，通过解压目录中的独立 validate.mjs 验证示例，结果见 portable-validation.json，摘要清单见 contract-files.json。ZIP SHA-256 为 `2D248DBF750962AF24A7EFBC1466C2417FAFEB6FF0B7967D3ECDFF97C986F843`。隔离工具配置与临时解压副本仅本地保留，不加入版本管理。

## 验证

使用用户指定的 Node v24.19.0 / npm 11.17.0。完整检查 31 项通过，桌面回归用例包含 231 个断言；日志见 check.log。检查覆盖成品增量追加后完整发布、源头修订、必填 README、Markdown 格式、路由冲突、非法路径、UTF-8、未发布文件和图片引用，另覆盖书卷折叠、同一文档重选、章节直达、历史前进后退、多个小说窗口、键盘边界、加载失败重试及迟到响应处理。构建生成 17 个真实静态桌面入口，深层 HTTP 路径、资源和发布字节检查通过。干净副本不依赖 art 或其他项目目录即可构建。

在 Codex 浏览器中实际检查了长章节、卷 README、键盘翻页、浏览器后退、目录隐藏和边缘箭头。桌面 1280×900 下正常阅读区高度 432，滚到底后最后一行盒顶相对于阅读区顶约 -0.16 像素；最大化后高度 774，相对位置约 +0.29 像素，符合像素舍入范围。隐藏目录后阅读宽度增加至 616。靠近右边缘成功显示并触发下一章；移开后观察到 opacity 从可见值下降，计算样式的淡出时间为 1s，结束后 opacity 为 0。

恢复浏览器默认窄屏尺寸并刷新后，目录默认隐藏，阅读区域 clientWidth 与 scrollWidth 同为 286，没有横向溢出；所有页面图片加载成功，捕获的浏览器 error 日志为空。临时 viewport 覆盖已撤销，预览标签页保留在第二章。已重启本地预览服务以载入新构建模块，地址为 `http://127.0.0.1:4173/`。

本轮没有 Git 写操作、远端操作或发布。用户后续审阅实际阅读质感；个性化视觉配置在明确下一轮需求后继续。
