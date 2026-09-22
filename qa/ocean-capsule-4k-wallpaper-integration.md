# Ocean Capsule 4K Wallpaper Integration

Project: yigrass.github.io · Task path: Personal Website / Ocean Capsule 4K Wallpaper Integration · Active task: Ocean Capsule 4K Wallpaper Integration · Status: completed · Position: main

Date: 2026-09-22. Parent: Personal Website. Return point: Personal Website / Review 4K wallpaper.

用户明确选用 `art/backgrounds/ocean-capsule-v2/draft-pixelart-ase.png` 作为主页背景，并说明已在 Aseprite 中调整尺寸。本轮查看并解码文件，确认实际尺寸为 3840×2160、比例为 16:9、大小为 215072 字节，可解码为带 alpha 通道的 PNG。尺寸调整过程来自用户说明；本轮没有调用 Aseprite、重新生成或重采样图片。

将用户文件原样复制到新的运行时资源 `assets/wallpapers/ocean-capsule-pixelart-v2.png`，并更新 `assets/site-config.js` 与 `assets/styles.css` 的背景引用。继续使用居中的 `contain` 和 `no-repeat`，填充色保持柔白 `#f2f1ed`。旧运行时图片及源图均保留。README 更新为当前来源、尺寸和验收记录，并移除已不符合文件现状的旧 SVG 保留说明；该 SVG 的删除在本轮开始时已存在，本轮未删除或恢复它。

校验通过：配置在 V8 中执行成功；源码对比确认 CSS 与配置相对本轮开始时仅改变图片文件名，显示策略与填充色保持一致；运行时副本可解码为 3840×2160，源文件和副本 SHA-256 均为 `B207F61EFB1897AA52C93C65E33D69D21B603AB8E747D890754954A1D82EEF75`。上一版背景摘要仍为 `D6B72A02D54138E723B0C55F11D9A3206EB1538667ED00CA485C81A4B99DA4F8`。`git diff --check` 通过。本轮未运行浏览器视觉验收。

已有未提交修改、其他用户图片及历史任务记录保留。完成后返回 Personal Website，释放本轮写入租约；MVP 继续保持 completed。本轮只完成本地接入，没有 Git 写操作或远端发布。
