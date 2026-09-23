# Art Untracking and Source Layout Plan

Project: yigrass.github.io · Task path: Personal Website / Art Untracking and Source Layout Plan · Active task: Art Untracking and Source Layout Plan · Status: completed · Position: main · Date: 2026-09-23

## Scope and authorization

用户明确要求创建美术目录忽略规则，并取消 Git 对现有 `art/` 文件的跟踪，同时保留本地内容。本轮仅对 `art/` 执行索引移除；未暂存其他文件，未提交、改写历史或联系 Git 远端服务。目录整理按用户要求先交付计划，未移动网站源码或建立构建产物。

全局约定与项目 README、任务快照、生成视图和相关变更记录已读取；项目内未发现额外 AGENTS.md。当前任务的写入范围记录在任务控制的进入事件及对应快照中，完成后释放执行租约。

## Changes

`.gitignore` 新增 `/art/`。对 46 个原受跟踪文件执行 `git rm -r --cached --quiet -- art/`，保留工作区文件。第一次在沙箱中执行因无法写入 `.git/index.lock` 失败，随后按工具权限流程申请同一条命令的执行权限并成功完成，没有改用其他方式绕过权限。

检查发现活动箭头生成脚本依赖 `art/pixel-ui/v1.3.0/derive-arrows.lua`。为避免新检出缺少依赖，将其字节原样复制到 `scripts/pixel-ui/derive-scrollbar-arrows.lua`，并更新 `scripts/generate-scrollbar-arrows.ps1` 的引用。原文件未改动，未执行 Aseprite，未重绘任何图片。

新增 [Source and Release Separation](../../docs/SOURCE_LAYOUT_PLAN.md)，明确 `src/`、上线素材 `assets/` 和生成网站 `dist/` 的边界，以及应用拆分、统一路由、HTTP 本地预览、手动 Pages 发布和验收标准。更新 README 反映本轮真实状态，保留当前使用命令，未把计划写成已实现功能。

## Verification

检查输入保存在 [before.json](before.json)，结果保存在 [results.json](results.json)。46 个本地文件的相对路径、字节长度和 SHA-256 全部与操作前一致。`git ls-files -- art/` 为空，46 个原路径均命中忽略规则；索引中恰有 46 项 `art/` 删除，无其他新增暂存改动，HEAD 与操作前一致。

复制前后 Lua 的 SHA-256 均为 `045965588C665425306BB15C4800511E607C9D90AD00ED3CC2B23D8F0D12C596`。PowerShell AST 语法检查通过；活动 `scripts/` 内已无 `art/` 路径依赖。此轮没有运行时界面变更，因此不重复执行浏览器或界面回归测试。任务视图生成、一致性检查和 Git 差异空白检查在交付前执行。

## Historical files and next step

取消跟踪只影响当前索引及今后的提交，旧提交仍含原文件。彻底从相关历史移除需要另行执行历史重写，会改变相关 commit ID，并涉及由用户协调远端更新及其他副本；本轮未将用户关于可行性的询问视为重写授权。机制参考 [git rm 文档](https://git-scm.com/docs/git-rm) 和 [GitHub 历史清除说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)。

Return point: Personal Website / Review source layout plan。下一步是审阅目录迁移计划；实际迁移单独记录为 pending 任务，当前网站运行文件保持原位置。重要的本地原稿不再由未来 Git 提交提供备份。
