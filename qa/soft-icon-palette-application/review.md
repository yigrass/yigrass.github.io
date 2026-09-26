# Soft Icon Palette Application

Project: yigrass.github.io. Task path: Personal Website / Soft Icon Palette Application. Active task: Soft Icon Palette Application. Status: completed. Position: main. Return point: Personal Website / Review softened icons.

用户批准 B，并明确授权处理 art/pixel-ui/downloads/calming_icons_512x512_alter 中全部图标后替换网站的八张。64 张 PNG 已完成处理并写回该目录；网站 assets/pixel-ui/calming 的 cd_drive、drive、flop_drive、this_computer、folder_dark、tools、notepad 和 text_file 已从处理后的目录原样复制。原始 calming_icons_512x512 目录、其余美术、光标、正式小说成品和应用源码均未改动。README 已说明以后从 _alter 取用已处理素材，不应重复调色。

## Processing and validation

权威处理参数见 filter.json：按批准的 CSS 顺序，在 sRGB 中执行饱和度、对比度及亮度变换，最后量化到 8 位；采用 [W3C Filter Effects 的饱和度矩阵和线性分量变换](https://www.w3.org/TR/filter-effects-1/#feColorMatrixElement)。不移动像素、不缩放、不模糊，透明度逐像素保留，完全透明像素的隐藏 RGB 原样保留。

Aseprite 使用既有隔离启动器。doctor/result.json 记录环境检查，transform-v2/result.json 和 exports-v2 下各文件的 result.json 记录最终处理及独立 PNG 导出。每张图先输出到全新暂存路径，检查工具日志和文件存在性，再由 Pillow/NumPy 独立解码并验证可见 RGB 数值、透明度、512×512 尺寸和单帧属性。64 张全部通过；inputs.json、validated-outputs.json 与 applied-verification.json 保留前后 SHA-256 及应用结果。原图 64 张摘要保持不变。

替换后八张网站素材在 assets、dist、HTTP 响应与 _alter 中字节一致。构建通过，生成 15 个桌面入口和一个正式作品。真实浏览器验证开始菜单、磁盘列表、标题栏、任务栏及阅读器卷别/章节图标加载正常，CSS 没有叠加第二次滤镜，控制台无警告或错误。desktop.png 和 reader.png 记录最终页面。仅素材与维护文档变更，因此使用批量像素校验、构建和浏览器检查，未重复运行无关的桌面交互测试。

## Execution notes

首次 Lua 暂存路径因 gsub 多返回值被 joinPath 当作额外的路径部分，未生成可用 sprite；在复制到目标之前已发现并修正为单独的文件名变量，增加保存后文件断言。首次日志保留在 transform、exports 及 attempt-01-processed.json，最终以带 v2 的记录为准；原图与目标在失败阶段均未写入。

应用验证后清除了本任务生成的暂存 sprite、PNG 副本和导出隔离配置，保留日志、处理参数、摘要及截图，避免把本应仅保留在本地 art 的 64 张素材复制进 Git 管理的 QA。导出脚本和校验脚本是本轮处理记录，不可直接再次对已处理的 _alter 运行；输入摘要检查用于防止重复应用。

既有预览进程在替换素材前已停止，未改动进入任务时已有修改的上一任务预览日志。新本地预览进程为 25344，地址为 http://127.0.0.1:4173/。未执行 Git 写操作或远端发布；_alter 继续受 art 忽略规则覆盖。
