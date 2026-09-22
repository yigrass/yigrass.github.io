# Ocean Capsule Wallpaper Integration

Project: yigrass.github.io · Task path: Personal Website / Ocean Capsule Wallpaper Integration · Active task: Ocean Capsule Wallpaper Integration · Status: completed · Position: main

Date: 2026-09-22. Parent: Personal Website. Return point: Personal Website / Review homepage wallpaper.

用户明确选用 `art/backgrounds/ocean-capsule-v2/draft-pixelart-4x.png` 作为主页背景，并说明该文件经过 Retro Diffusion 处理。本轮将其原始字节复制到 `assets/wallpapers/ocean-capsule-pixelart-v1.png`，更新 `assets/site-config.js` 的默认背景和 `assets/styles.css` 中脚本加载前使用的背景引用。

图片实际尺寸为 2076×1132，文件大小为 236623 字节，可解码为带 alpha 通道的 PNG。本轮没有重新生成、调色、裁剪、缩放或转码图片；Retro Diffusion 的处理过程来自用户说明，未独立验证其具体算法或统一像素网格。原始文件、早期候选及其交付记录均保持不变。

桌面继续使用 `background-size: cover` 和居中位置，等比例铺满可用桌面区域，不拉伸图片；不同屏幕比例会裁剪边缘，竖屏主要保留中央门洞与海天。加载前的桌面底色、配置中的主题色和 HTML 浏览器主题色同步为 `#383c39`，取自图片左上角的深灰绿。窗口、菜单及其交互代码没有修改。

已执行图片解码、原图与运行副本 SHA-256 一致性、配置脚本 V8 执行、配置与 CSS 图片路径一致性、居中铺满声明、三处底色一致性和原背景资料摘要检查。配置仅改变 wallpaper 与 themeColor 两个字段，`git diff --check` 通过。源文件与运行副本的 SHA-256 均为 `D6B72A02D54138E723B0C55F11D9A3206EB1538667ED00CA485C81A4B99DA4F8`。

本轮完成本地背景接入，未运行浏览器视觉验收，也未执行 Git 写操作或远端发布。MVP 里程碑继续保持 completed，后续需求仍以独立迭代任务处理。
