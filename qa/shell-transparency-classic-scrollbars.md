# Shell Transparency and Classic Scrollbars

Project: yigrass.github.io · Task path: Personal Website / Shell Transparency and Classic Scrollbars · Active task: Shell Transparency and Classic Scrollbars · Status: completed · Position: main

Date: 2026-09-23. Parent: Personal Website. Return point: Personal Website / Review desktop controls.

用户认可上一轮背景效果，并要求底色透明度同时影响开始菜单与底部任务栏，滚动条和箭头恢复 Win95 风格。本轮将菜单专用 CSS 变量改为共用的 `--shell-alpha`，开始菜单和任务栏均以该变量控制银灰底色的 alpha。设置窗口分组改为“开始菜单与任务栏”，提示说明两者同时调整。没有对整个容器设置 opacity，文字、图标及按钮继续清晰显示。现有 `menuTransparency` 配置字段与 `yigrass.desktop.preferences.v1` 存储键保持不变，因此既有保存值继续适用。

滚动条使用浏览器原生控件的样式接口，采用 16 CSS 像素宽度、银灰方形滑块、凹凸边框、现有 2×2 黑白灰点阵资源和四向整数网格箭头。箭头含常态和灰色禁用状态，按钮按压时呈凹陷效果并移动箭头一个像素；起点只显示递减按钮，终点只显示递增按钮。删除窗口内容的旧 scrollbar-color 和任务标签、目录树的 thin 设置，避免覆盖自定义样式。样式统一覆盖垂直和水平滚动区域，没有增加滚动事件、替换原生滚动实现或修改背景图。

支持 `::-webkit-scrollbar` 的浏览器启用完整样式，并将标准 scrollbar-color/scrollbar-width 设为 auto，避免这些属性覆盖伪元素样式；不支持的浏览器保留原生控件，使用匹配的灰色与正常宽度。因此这不是所有浏览器像素完全一致的自绘滚动条。参考 [WebKit 滚动条样式说明](https://webkit.org/blog/363/styling-scrollbars/) 和 [MDN scrollbar-color 说明](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/Properties/scrollbar-color)。

验收通过：应用脚本在 V8 中编译成功，配置执行成功；提取实际 applyPreferences 函数，在模拟 DOM 和存储中验证 0%、50%、100%、35% 四个值，确认共用 alpha、设置显示值、滑块值与保存的 menuTransparency 同步。源码检查确认两处底色均使用共用 alpha，旧变量和旧细滚动条覆盖项已移除。8 个内嵌箭头 SVG 均通过 XML 解析，尺寸为 16×16，使用 crispEdges；点阵 PNG 存在。`git diff --check` 通过。

浏览器工具再次返回 `nodeRepl.fetch request failed`，本轮未能执行真实浏览器的滚动条渲染、鼠标滚动、拖动或刷新后的存储验收；上述验证是源码、V8 模拟及资源检查，没有用模拟结果冒充浏览器测试。

README 和后继任务控制已更新，完成后返回 Personal Website 并释放本轮租约。旧 QA、像素资源、背景及已完成 MVP 保留；没有 Git 写操作或远端发布。
