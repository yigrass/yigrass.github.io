# Novel Release Contract

Project: yigrass.github.io · Task path: Personal Website / Novel Release Contract · Active task: Novel Release Contract · Status: completed · Position: main · Date: 2026-09-23

## Delivery

交付 contracts/novel-release-v1，包含中文 README、release.schema.json、独立 validate.mjs 和完整两章示例。源头小说项目可以复制该目录，按合同导出自己的 dist；网站只接收完整当前成品，不依赖生产者源码或工具路径。校验器无第三方依赖，只读输入，不联网，不执行导入或删除。

合同落实用户对小说的明确选择：每章只保留当前文件，只有一份完整 release.json，不使用版本目录或历史发布清单；正文修订在源头处理后整套替换。目录数组给出阅读顺序，UTF-8 纯文本支持可选的按段落位置插入图片；不隐式解析 Markdown 或 HTML。

可移交压缩包为 novel-release-v1.zip。压缩包逐项核对 7 个文件的字节长度和 SHA-256，全部与合同目录一致；具体摘要见 results.json。示例插图复制现有图标，原图片未修改，示例不参与网站发布。

## Verification

完整检查通过 20 项 Node 测试，其中桌面回归包含 175 条记录断言。新增加的合同示例测试确认两章及一张插图构成有效完整成品；独立复制校验器后运行成功。其他用例覆盖追加第 16 章、同路径修订、残留草稿、缺失正文、重复章节、越界路径、空文本、错误编码、插图位置及格式签名，以及构建与 HTTP 行为。

交付前复核操作前记录的 79 个受保护文件，所有 art 和原有图片的 SHA-256 不变；HEAD 和 Git 索引保持基线，未执行 Git 写操作。源码迁移的首次完成记录保留在 qa/source-release-separation/review.md，不用本报告改写其当时检查数量。

本机预览服务已在 http://127.0.0.1:4173/ 启动，仅提供 dist。实际浏览器工具连接失败，未声称完成视觉、指针或远端 Pages 验收。生成任务视图、控制检查和差异空白检查在交付时通过；用户需自行推送、设置 Pages Source 并手动触发已准备的工作流。

Return point: Personal Website / Review source and novel release contract。
