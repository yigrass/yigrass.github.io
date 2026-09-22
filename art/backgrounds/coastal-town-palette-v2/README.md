# Coastal Town Palette Variants

Project: yigrass.github.io · Task path: Personal Website / QQ Space MVP / Coastal Town Palette Variants · Active task: Coastal Town Palette Variants · Status: completed · Position: main

Date: 2026-09-20. Parent: QQ Space MVP. Return point: QQ Space MVP / Review background palette.

用户认可海边小镇的整体气氛，但认为红砖红瓦抢走了海天和植物的注意力。本轮使用内置 OpenAI image_gen，将原始候选分别编辑为三种低饱和屋顶配色，用于比较色彩关系。

| 候选 | 图片 | 色彩关系 | 完整提示词 |
| --- | --- | --- | --- |
| A · 蓝灰 | [slate-blue.png](slate-blue.png) | 呼应海面与远山，屋顶融入海天；本轮优先建议 | [slate-blue-prompt.txt](slate-blue-prompt.txt) |
| B · 灰绿 | [sage-gray.png](sage-gray.png) | 呼应植物，建筑与植被之间过渡更柔和 | [sage-gray-prompt.txt](sage-gray-prompt.txt) |
| C · 浅沙灰 | [sand-gray.png](sand-gray.png) | 呼应石墙与夕阳，小镇更明亮，保留较暖的倾向 | [sand-gray-prompt.txt](sand-gray-prompt.txt) |

三版独立引用 `../coastal-town-v1/draft.png`，没有逐版叠加编辑。视觉检查确认整体构图、海天、植物和暖窗气氛保留，红瓦的大块暖色对比明显降低；生成式编辑存在局部细节差异，不保证屋顶之外逐像素完全一致。用户尚未选择最终方案。

三张图片都是工具原始输出的完整副本，均为 1672×941、每通道 8-bit RGB PNG（color type 2），不是 8-bit 索引色 PNG。已通过 System.Drawing 解码并验证复制前后 SHA-256，尺寸与摘要记录在 `manifest.json`；原图摘要未变。当前仅完成配色候选，没有验证严格像素网格、执行像素整理或制作移动端裁剪。

原始候选与生成文件保留，网站背景尚未替换。Developer Mode 和 Chapter Backgrounds 继续保持 pending。本轮未修改网站代码、执行 Git 写操作或联系远端。
