# Scrollbar Arrow Assets review

Project: yigrass.github.io · Task path: Personal Website / Scrollbar Arrow Assets · Active task: Scrollbar Arrow Assets · Status: completed · Position: main

Date: 2026-09-23. Parent: Personal Website. Return point: Personal Website / Review scrollbar controls.

## Delivered scope

明确向用户说明：此前箭头是 CSS 内嵌 SVG，没有独立图片文件；四方向使用相同 path 和不同旋转参数，普通与禁用状态分别重复编码。本轮改为一张实际向上 PNG 原图 `assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png`，以及由其生成的三个旋转方向和四个禁用版本。CSS 直接引用这些图片，不再包含箭头 SVG 或临时运行时图像脚本。

横向滚动条高度与竖向滚动条宽度统一为 `--statusbar-size` 的 25px，所有箭头按钮宽、高同为 25px。原图 15×15，在按钮内按原像素大小居中，四周各留 5px。按下时从居中位置向右下偏移 1px；凸凹边框、点阵轨道和原生滚动行为继续沿用。

用户只需修改向上 PNG，再运行 `scripts/generate-scrollbar-arrows.ps1` 更新派生图。脚本从不覆盖原图，派生图不应手工编辑。初始 Aseprite 文件仅保留首次绘制记录，不与日常可编辑 PNG 并列为权威来源。采用预先生成方式，网页及本地 file 预览无需读取 canvas 像素。README 已同步说明。

## Evidence

通过 aseprite-automation 固定启动器执行，使用隔离配置和 Aseprite 1.3.18.1-x64。初次 doctor 成功，目录或源文件写入受沙箱限制时获准重试同一路径与启动器。未直接调用 Aseprite 可执行文件，未修改用户真实配置。

初始 doctor 目录为 `qa/scrollbar-arrow-assets/.aseprite-automation/runs/20260923-151958-e7d698ba`；初始源生成目录为 `20260923-152335-3d048126`，PNG 导出目录为 `20260923-152336-9a054909`。完整派生运行和逐个 export 的成功记录保存在 `qa/scrollbar-arrow-assets/derived/20260923-173452-9c3578e2/generation.json`。派生运行再次通过 doctor，Lua 保存中间 Aseprite 文件，八个 export 独立执行（七个运行时派生图及一张 QA 对照图）。失败的沙箱尝试日志保留。

实际解码八张运行时 PNG：均为 15×15、单帧、8-bit 索引色、二值透明度；普通状态两色（含透明），禁用状态三色。右、下、左派生图的全部像素与 System.Drawing 对原图执行 90°、180°、270° 旋转的独立结果完全一致。摘要和逐文件结果保存在 `pixel-checks.json`。初始原图 SHA-256 为 `85B23C2251236CBFC477C9682D5951578F4B89EC78C13CA3EC4725AA5CAA6028`，派生生成前后未变。

已查看 `derived/20260923-173452-9c3578e2/contact-sheet.png`：上排依次为上、右、下、左普通箭头，下排为对应禁用状态，方向和统一的右下高光符合要求。该图片是资源对照图，不是网页截图。

CSS 尺寸约束、八个图片引用、无遗留内嵌 SVG 或运行时变量、静态项目入口与根模板一致性，以及受保护文件未变均检查通过。未重新运行旧项目导航测试，其“横向仍为16px”断言是上一轮的历史验收条件，已由本轮用户要求取代；项目导航实现未改动。`git diff --check` 与任务控制生成和一致性检查通过。

本轮没有声称真实浏览器视觉验收；此前浏览器连接不可用，资源检查不能代替最终网页外观。没有执行 Git 写操作、远端通信或发布。MVP 和既有完成记录保持不变。
