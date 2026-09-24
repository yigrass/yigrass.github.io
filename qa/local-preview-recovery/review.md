# Local Preview Recovery

Project: yigrass.github.io · Task path: Personal Website / Local Preview Recovery · Active task: Local Preview Recovery · Status: completed · Position: main

Date: 2026-09-24. Parent: Personal Website. Return point: Personal Website / Review novel reader template.

用户报告 127.0.0.1:4173 无法加载，直接访问返回连接被拒绝。此前服务退出的具体原因没有足够证据，不归因于应用源码或特定进程管理行为。

使用指定 Node v24.19.0，通过 Start-Process 的 Hidden 模式启动现有 scripts/dev.mjs，进程 ID 为 23744；运行日志和 PID 记录只在本任务目录本地保留。构建成功，生成 17 个桌面入口和两个作品成品。服务仍只监听脚本指定的 127.0.0.1。

新进程启动后，在另一条独立 shell 调用中，首页、第二章静态入口、Markdown 解析模块和第二章正文均返回 HTTP 200，标准错误日志为空。沙箱中的 Get-NetTCPConnection 后续查询被拒绝；可用性结论依据实际 HTTP 响应和服务日志，不宣称该端口查询成功。没有修改应用源码、Git 状态或远端配置。

地址是本机进程提供的临时预览；电脑重启或进程退出后，需要在仓库目录重新运行 npm.cmd run dev。此次后台启动不构成开机自启或常驻服务安装。
