// 这里是站点内容和默认设置的唯一编辑入口。修改后随网站一起发布。
// 图片使用仓库内相对路径。作品链接可以是本站路径或 https 地址。
window.SITE_CONFIG = {
  siteTitle: "yigrass — 个人桌面",
  startLabel: "开始",
  menuBrand: "yigrass",
  menuLabels: { profile: "我的电脑", works: "资源管理器", settings: "系统设置" },
  wallpaper: "assets/wallpapers/ocean-capsule-pixelart-v1.png",
  wallpaperPosition: "center center",
  themeColor: "#383c39",
  defaults: { menuTransparency: 0, customCursor: false, floatingStars: false },
  profile: {
    nickname: "yigrass",
    avatar: "", // 可填写高清图片路径；留空时使用电脑图标。
    signature: "Meet me here.",
    introduction: "", // 显示在“个人介绍”页签，可用换行分隔段落。
    links: [] // 示例格式：{ label: "我的链接", href: "https://example.com" }
  },
  // 这些是网站中的虚拟驱动器，不会读取访客电脑。当前仅提供空目录结构。
  explorer: {
    drives: [
      { id: "a", letter: "A", label: "3.5 英寸软盘", type: "floppy" },
      { id: "c", letter: "C", label: "本地磁盘", type: "hard-disk" },
      { id: "d", letter: "D", label: "本地磁盘", type: "hard-disk" },
      { id: "e", letter: "E", label: "光盘驱动器", type: "cdrom" }
    ]
  },
  // 保留未来作品数据入口；本版资源管理器只展示驱动器，暂不渲染作品。
  works: []
};
