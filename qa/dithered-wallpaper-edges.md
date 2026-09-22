# Dithered Wallpaper Edges

Project: yigrass.github.io · Task path: Personal Website / Dithered Wallpaper Edges · Active task: Dithered Wallpaper Edges · Status: completed · Position: main

Date: 2026-09-22. Parent: Personal Website. Return point: Personal Website / Review wallpaper edge blend.

用户要求将偏亮的白色填充改为接近图中阴影的深灰，并通过类似 dithering 的效果消除图片硬边。对当前图片按 24 像素间距采样后，确认 `#2d2f2d` 是实际存在的阴影颜色；本轮将配置、CSS 初始底色、脚本缺省值和 HTML 浏览器主题色同步设为该色。

新增 `assets/wallpaper-edges.js` 与装饰 Canvas。背景继续由原 CSS 按 contain 等比例完整显示；脚本读取图片实际尺寸和桌面区域，使用 4×4 Bayer 阈值矩阵，以 2 CSS 像素的实色方块覆盖图片四周，覆盖密度从最外缘逐渐降低。过渡带取图片显示宽高较小值的 8%，上限为 40 CSS 像素，中心区域完全透明。Canvas 位于窗口和星星图层之前，设置 `pointer-events:none` 和 `aria-hidden=true`，不参与交互。图片加载与尺寸变化触发重绘，重绘请求合并到单个动画帧；没有持续动画循环。图片加载失败时保留普通 CSS 背景。常规居中、百分比及像素背景位置可对齐；复杂 calc() 位置目前按居中处理。

原 3840×2160 PNG 未修改，SHA-256 仍为 `B207F61EFB1897AA52C93C65E33D69D21B603AB8E747D890754954A1D82EEF75`。这次实现的是页面显示效果，没有重新生成、缩放或编辑源图片。

V8 中编译应用脚本并执行配置，通过模拟 DOM、Canvas、图片加载及 ResizeObserver 运行实际边缘脚本，捕获绘制矩形进行检查。覆盖桌面区域 1280×672、390×792、900×900、1280×720，以及在 1920×1032 区域显示纵向 600×900 图片的场景；所有矩形均位于实际图片范围内，未覆盖中心。模拟从横屏到竖屏的尺寸变化，Canvas 尺寸与绘制范围同步更新。颜色引用、CSS contain、层级顺序和不接收鼠标事件的设置已检查，`git diff --check` 通过。

横屏与竖屏实际脚本绘制指令保存在 `dithered-wallpaper-edges/draw-capture.json`。使用 `dithered-wallpaper-edges/render-preview.ps1` 通过 System.Drawing 合成静态预览并目视检查，确认边缘逐步融入深灰底色，中央海天与室内构图保留。预览为桌面背景区域，不含任务栏和窗口，也不代表浏览器截图；浏览器工具调用因连接错误 `nodeRepl.fetch request failed` 未能执行视觉验收。共享 Node 版本探测被系统拒绝执行，本轮没有使用其他 Node 运行时替代。

静态预览：[横屏](dithered-wallpaper-edges/desktop.png) · [竖屏](dithered-wallpaper-edges/portrait.png)。实际浏览器的亚像素栅格化可能与静态预览略有差异。

原始图片、历史记录与已完成 MVP 保持不变。完成后返回 Personal Website，释放本轮写入租约。本轮没有 Git 写操作或远端发布。
