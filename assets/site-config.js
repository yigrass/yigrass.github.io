// 这里是站点内容和默认设置的唯一编辑入口。修改后随网站一起发布。
// 图片使用仓库内相对路径。作品链接可以是本站路径或 https 地址。
window.SITE_CONFIG = {
  siteTitle: "yigrass — 个人桌面",
  startLabel: "开始",
  menuBrand: "yigrass",
  menuLabels: { profile: "我的电脑", works: "资源管理器", settings: "系统设置" },
  applicationRoutes: { profile: "my-computer", works: "file-explorer", settings: "system-settings" },
  wallpaper: "assets/wallpapers/ocean-capsule-pixelart-v2.png",
  wallpaperPosition: "center center",
  themeColor: "#2d2f2d", // 壁纸周围填充、边缘抖动过渡及加载前的桌面底色。
  defaults: { themeId: "retro-ink", menuTransparency: 0, customCursor: false, floatingStars: false },
  profile: {
    nickname: "yigrass",
    avatar: "", // 可填写高清图片路径；留空时使用电脑图标。
    signature: "Meet me here.",
    introduction: "", // 显示在“个人介绍”页签，可用换行分隔段落。
    links: [] // 示例格式：{ label: "我的链接", href: "https://example.com" }
  },
  // 虚拟驱动器；slug 定义资源管理器下的磁盘地址，作品通过 driveId 归入磁盘。
  explorer: {
    drives: [
      { id: "a", letter: "A", label: "3.5 英寸软盘", type: "floppy", slug: "a-floppy-disk" },
      { id: "c", letter: "C", label: "本地磁盘", type: "hard-disk", slug: "c-local-disk" },
      { id: "g", letter: "G", label: "光盘驱动器", type: "cdrom", slug: "g-cd-rom" },
      { id: "h", letter: "H", label: "闪存盘", type: "flash-drive", slug: "h-flash-drive" }
    ]
  },
  // category 仅用于内部图标与内容类型；driveId 决定磁盘，slug 是磁盘下的地址名。
  // 修改应用地址、磁盘 slug 或作品后运行 scripts/generate-project-pages.cjs，生成静态入口。
  // 外部作品可用 url 代替 slug。显示名称直接使用 title；地址变更不保留旧入口。
  works: [
    { id: "story-a", title: "Story-A.txt", category: "novel", driveId: "a", slug: "story-a" },
    { id: "game-b", title: "Game-B.exe", category: "game", driveId: "g", slug: "game-b" }
  ]
};
