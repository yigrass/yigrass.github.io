# Received Content Review

Project: yigrass.github.io | Task path: Personal Website / Received Content Review | Active task: Received Content Review | Status: completed | Position: main

Date: 2026-09-26. Parent: Personal Website. Return point: Personal Website / Review received content findings.

## Finding

新成品 content/cacophony/ 可被当前接收器、构建流程和通用阅读器读取，但 catalog/projects.json 尚未登记它。当前网站只登记桑海志怪演示与 Game-B，所以正常构建不会复制或生成《杂音》的页面，A 盘也不会显示它。接入时需增加 category 为 novel、driveId 为 a、release 为 content/cacophony/ 的目录项。本轮是检查，正式目录登记与成品文件均未修改。

## Received artifact

清单为 novel-release-v4，书标识 cacophony，书名《杂音》，status 为 ongoing。一卷 jht 的展示标题为《露力丽的歌》，五章依清单排列为 JHT-00-白雾、JHT-01-起风、JHT-02-泡沫、JHT-03-挡路、JHT-04-水之誓约。标题均由各 Markdown 的 H1 正常提取，网站不重新编号或调整命名。

根目录只有 README.md、release.json、text/、images/ 四项，共九个文件；整书和卷 README 均在约定位置，五章正文全部以 UTF-8 读取成功。40×40 PNG 图标 images/book/mew-icon.png 可以解码并已目视检查。未发现阻碍本成品被当前网站接收的包内问题。本检查不校对小说内容，也未增加生产者业务校验器。

## Verification

检查脚本 inspect.mjs 将网站输入复制到项目自己的临时目录，仅在该副本中添加新作品登记。临时构建生成 24 个桌面入口、接收三份成品；新书的整书、卷及五章共七个入口全部通过 HTTP 200 检查。九个成品文件在临时发布目录中的响应字节与原文件逐一相同。

使用既有 DOM 模拟工具执行真实阅读器模块，七页的 H1、段落数量、图标路径、目录标题及顺序全部通过。它证明加载和渲染节点正确，不替代真实浏览器的布局视觉验收。本轮未声称执行浏览器页面视觉检查。

results.json 保存每个文件的 SHA-256、整包摘要、页面与检查结果，check-verified.log 为通过记录。初次辅助检查在清理临时副本时遇到 Windows 下 esbuild 可执行文件锁，见 check.log；脚本改为先关闭临时构建服务后重跑通过，临时目录均已清理。未修改正式 dist、应用源码、catalog 或成品；未执行 Git 写操作或远端操作。

## Proposed registration

```json
{
  "category": "novel",
  "driveId": "a",
  "release": "content/cacophony/"
}
```

登记并重新构建后，整书地址为 /file-explorer/a-floppy-disk/cacophony/，首章地址为 /file-explorer/a-floppy-disk/cacophony/jht/00-mist/。现有演示作品的保留或撤下不属于本轮检查范围。
