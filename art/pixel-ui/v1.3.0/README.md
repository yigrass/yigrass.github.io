# Scrollbar arrow source

唯一的日常图像编辑入口是 `assets/pixel-ui/v1.3.0/scrollbar-arrow-up.png`。用 Aseprite 修改这张向上箭头 PNG，保持 15×15、单帧、二值透明度，保存后从仓库根运行 `./scripts/generate-scrollbar-arrows.ps1`。该脚本仅读取原图，通过固定 Aseprite 启动器生成其他三个方向及四个禁用状态，不覆盖原图。

`scrollbar-arrow-initial.aseprite` 和 `create-arrow.lua` 记录首次种子图，不是后续修改的第二份权威来源。不要重新导出初始种子覆盖已经手工编辑的 PNG。`derive-arrows.lua` 是旋转与禁用状态的生成逻辑，运行时 PNG 派生图位于 `assets/pixel-ui/v1.3.0/generated/`。

选择 15×15 透明画布，让它在 25×25 按钮中四周各留 5 个整像素；保留原先 7 像素宽的阶梯三角形。右、下、左分别是向上原图的顺时针 90°、180°、270° 旋转。禁用状态在旋转后统一添加灰色图案和向右下偏移一像素的白色高光。

首次导出与像素验证见 `qa/scrollbar-arrow-assets.md` 和 `qa/scrollbar-arrow-assets/pixel-checks.json`。后续每次生成均在 QA 目录下创建新的时间戳运行目录，不覆盖首次记录。网页直接引用已生成 PNG，不需要 Aseprite 或浏览器 canvas 读图。
