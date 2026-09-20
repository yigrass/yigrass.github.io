# Pixel UI assets

Base asset version: 1.0.0; Explorer extension: 1.1.0.

这些资源用于界面图标、窗口按钮、光标和星星。它们由本目录的 `generate-pixel-ui.lua` 在 Aseprite 中逐像素绘制，并导出为真实的 8-bit 索引色 PNG（PNG color type 3、bit depth 8）。同一调色板预留 256 个索引，实际设计使用至多 18 个颜色项，包含透明色；透明度仅为 0 或 255，没有抗锯齿边缘。

菜单主图标原生为 16×16，窗口按钮与星星原生为 8×8。网站使用 1×、2×或 4×整数尺寸以及 `image-rendering: pixelated` 展示这些资源。光标的 32×32 文件由原生 16×16 逐像素复制为 2×2 色块产生。星星移动对齐到 2 CSS 像素网格，不进行平滑旋转。

界面文字由浏览器正常排版，头像、作品封面和背景图片保持各自分辨率。像素渲染规则只应用于专用 UI 资源；没有对整个网页做低分辨率缩放。标题栏使用纯色，控件边框使用无模糊的硬边阴影。

每份 `.aseprite` 文件均可单独编辑。`manifest.json` 记录部署用 PNG 的尺寸、颜色数、格式和 SHA-256；`contact-sheet.png` 为资源检查图。生成和导出遵循本机 `aseprite-automation` 技能：先运行 doctor，再通过 run-script 执行 Lua，最后分别通过 export 导出 PNG。网站运行与发布本身不依赖 Aseprite。

导出后，应重新核验索引色格式、尺寸、非空图像、二值透明度及光标精确 2 倍复制；更新 manifest 中的摘要，再把部署资源放入 `assets/pixel-ui/`。源码尺寸发生变化时，应同步审查 CSS 的展示尺寸，保持整数比例。

## Explorer extension 1.1.0

`v1.1.0/` 新增电脑、控制面板、硬盘、软盘、光驱，以及后退、前进和向上箭头，共八个 16×16 图标。部署文件位于 `assets/pixel-ui/v1.1.0/`，独立源文件、确定性生成脚本、检查图与 manifest 位于本目录的同名版本子目录。基础版 1.0.0 的图片、源文件和 manifest 保持原样。

控制面板图案采用小窗口、彩色配置项和工具的组合，是为本站绘制的图案；参考 [Windows 98 Icon Viewer](https://win98icons.alexmeub.com/) 的年代风格，没有复制或打包其中的系统图标。新版本继续使用 8-bit 索引色和二值透明度，具体摘要与颜色计数以本版本 manifest 为准。
