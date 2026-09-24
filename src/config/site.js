// 这里是站点内容和默认设置的唯一编辑入口。修改后随网站一起发布。
// 图片使用仓库内相对路径。作品链接可以是本站路径或 https 地址。
export const siteConfig = {
  siteTitle: "yigrass — 个人桌面",
  startLabel: "开始",
  menuBrand: "yigrass",
  menuLabels: { profile: "我的电脑", works: "资源管理器", settings: "系统设置" },
  applicationRoutes: { profile: "my-computer", works: "file-explorer", settings: "system-settings" },
  wallpaper: "assets/wallpapers/industrial-gray.jpg",
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
};
