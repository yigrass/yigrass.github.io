// 这里是站点内容和默认设置的唯一编辑入口。修改后随网站一起发布。
// 图片使用仓库内相对路径。作品链接可以是本站路径或 https 地址。
window.SITE_CONFIG = {
  siteTitle: "yigrass — 个人桌面",
  startLabel: "开始",
  menuBrand: "yigrass",
  menuLabels: { profile: "我的电脑", works: "资源管理器", settings: "系统设置" },
  wallpaper: "assets/wallpapers/ocean-capsule-pixelart-v2.png",
  wallpaperPosition: "center center",
  themeColor: "#2d2f2d", // 壁纸周围填充、边缘抖动过渡及加载前的桌面底色。
  defaults: { menuTransparency: 0, customCursor: false, floatingStars: false },
  profile: {
    nickname: "yigrass",
    avatar: "", // 可填写高清图片路径；留空时使用电脑图标。
    signature: "Meet me here.",
    introduction: "", // 显示在“个人介绍”页签，可用换行分隔段落。
    links: [] // 示例格式：{ label: "我的链接", href: "https://example.com" }
  },
  // 虚拟驱动器；category 将作品归入对应磁盘。C 盘暂不分配内容。
  explorer: {
    drives: [
      { id: "a", letter: "A", label: "3.5 英寸软盘", type: "floppy", category: "novel" },
      { id: "c", letter: "C", label: "本地磁盘", type: "hard-disk" },
      { id: "g", letter: "G", label: "光盘驱动器", type: "cdrom", category: "game" },
      { id: "h", letter: "H", label: "闪存盘", type: "flash-drive", category: "utility" }
    ]
  },
  // 填入真实项目后显示对应入口；category 为 novel、game 或 utility。
  // 每项格式：{ id: "唯一标识", title: "项目名称", category: "novel", url: "项目网页地址" }
  // 小说名称会以 .txt 显示，但链接可以指向包含插图的完整项目网页。
  works: []
};
