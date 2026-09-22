# Ocean Capsule Resolution Trials

Project: yigrass.github.io · Task path: Personal Website / Ocean Capsule Resolution Trials · Active task: Ocean Capsule Resolution Trials · Status: completed · Position: main

Date: 2026-09-22. Parent: Personal Website. Return point: Personal Website / Review resolution trial results. Predecessor: Ocean Capsule Shoreline Refinement.

用户已接受岸沿第二版的画面内容，本轮仅测试内置 image_gen 是否能按提示词分别输出 1920×1080 和 2560×1440。两次独立调用都使用同一张 `../ocean-capsule-v2/draft.png`，提示词除目标尺寸数字外保持相同，要求保留构图、灰绿色调、仪器、海天和少量岸沿。

| Requested size | Original file size | Result | Artifact | Exact prompt |
| --- | --- | --- | --- | --- |
| 1920×1080 | 1672×941 | Not achieved | [requested-1920x1080.png](requested-1920x1080.png) | [Prompt](requested-1920x1080-prompt.txt) |
| 2560×1440 | 1672×941 | Not achieved | [requested-2560x1440.png](requested-2560x1440.png) | [Prompt](requested-2560x1440-prompt.txt) |

文件名中的 requested 表示本次请求尺寸，不表示文件实际尺寸。两份图片均读取了生成原文件的 PNG IHDR 宽高，并与图像解码结果交叉核对：实际都是 1672×941，因此不是聊天预览显示尺寸的问题。两份输出具有不同文件摘要，均为各自独立生成的结果，未复制同一图像冒充两个版本。

目视检查显示两版都保留了已认可的主要场景、灰绿色调、无人状态和天空大于海洋、陆地仅作过渡的关系；生成造成少量纹理和细节差异，不声称逐像素保留输入图。

本实验能确认：这两次调用中，仅通过提示词指定尺寸未生效。当前内置工具未开放独立尺寸参数，但无法据此断定其内部为何选择 1672×941，也不能将此结论推广成底层图像模型不支持其他尺寸。未对生成文件重采样或放大，未使用另行付费的 API，未替换网站背景。

两份生成文件已原字节保存，复制前后 SHA-256 一致。具体大小、摘要及生成来源见 [manifest.json](manifest.json)。第一、二版原交付及网站等 37 个受保护文件的摘要与本轮开始前一致；原有 MVP 完成状态保留。测试任务完成，两个请求尺寸均未达成。
