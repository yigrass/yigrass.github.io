# Pages Workflow Maintenance

Project: yigrass.github.io · Task path: Personal Website / Pages Workflow Maintenance · Active task: Pages Workflow Maintenance · Status: completed · Position: main

Date: 2026-09-23. Parent: Personal Website. Return point: Personal Website / Review Pages workflow maintenance.

用户报告 Pages 运行 `35873731828` 发布成功，同时提供两条 Node 20 弃用警告和两条 Ubuntu 环境迁移提示。本次依据这些用户提供的运行结果以及官方公开文档检查本地配置，没有访问该仓库的远端运行记录，也没有执行 Git 写操作或发布操作。

## 修改与依据

项目构建原本已使用 Node 24；警告来自 Action 自身声明的运行时。按照 [Node 20 弃用公告](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)，应升级对应 Action，而不只是调整项目的 `setup-node` 设置。

本地工作流将 `actions/configure-pages@v5` 升至 `@v6`，`actions/deploy-pages@v4` 升至 `@v5`；已检查两者官方 [configure-pages 清单](https://raw.githubusercontent.com/actions/configure-pages/v6/action.yml)和 [deploy-pages 清单](https://raw.githubusercontent.com/actions/deploy-pages/v5/action.yml)，均明确使用 `node24`。默认 token、默认部署产物名称及 `page_url` 输出继续支持当前工作流。

`actions/upload-pages-artifact@v4` 升至 `@v5`。已检查其 [官方清单](https://raw.githubusercontent.com/actions/upload-pages-artifact/v5/action.yml)：内部上传步骤引用 `actions/upload-artifact@bbbca2ddaa5d8feaa63e36b76fdaad77386f024f`（v7.0.0），该精确提交的 [运行时清单](https://raw.githubusercontent.com/actions/upload-artifact/bbbca2ddaa5d8feaa63e36b76fdaad77386f024f/action.yml)使用 `node24`。这会替换警告中由旧 Pages 上传组件间接引入的 Node 20 Action。`path: dist` 和默认 `github-pages` 产物名称继续适用。

两个 job 的 `ubuntu-latest` 改成 `ubuntu-24.04`。[官方环境迁移通知](https://github.com/actions/runner-images/issues/14748)说明 `ubuntu-latest` 将从 2026-10-19 开始迁移至 Ubuntu 26.04。固定操作系统版本可以避免这次隐式跨版本升级；它不意味着冻结 runner 镜像内所有软件更新。这两条 notice 本身不表示部署失败。

## 验证与范围

已检查工作流差异，运行配置恰好修改五行：三个 Action 版本和两个 runner 标签。手动触发、权限、并发规则、构建命令、`dist` 上传路径、部署依赖及环境设置均保留。官方新版本的输入、输出与运行时声明和本项目用法相容。`git diff --check` 通过；任务生成视图和任务控制检查通过。本次没有应用逻辑变更，不重复运行完整网站测试，也没有声称在本地执行了 GitHub 托管 runner。

用户提交并推送这些本地改动后，应在更新后的分支使用 **Run workflow** 新建一次运行，确认发布成功及这些提示消失。旧运行的历史提示不会被本地修改删除；[GitHub 重跑说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs)也明确重跑使用原事件的同一提交，因此应使用新的运行验收本次改动。
