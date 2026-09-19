// 这里是站点内容和默认设置的唯一编辑入口。修改后随网站一起发布。
// 图片使用仓库内相对路径。作品链接可以是本站路径或 https 地址。
window.SITE_CONFIG = {
  siteTitle: "yigrass — 个人桌面",
  startLabel: "开始",
  menuBrand: "yigrass",
  menuLabels: { profile: "个人信息", works: "个人作品" },
  wallpaper: "assets/wallpaper.svg",
  wallpaperPosition: "center center",
  themeColor: "#008080",
  defaults: { menuTransparency: 0, customCursor: false, floatingStars: false },
  profile: {
    nickname: "yigrass",
    avatar: "", // 可填写图片路径；留空时显示名字的首字母。
    signature: "Meet me here.",
    introduction: "", // 可用换行分隔介绍段落；留空时不展示占位介绍。
    links: [] // 示例格式：{ label: "我的链接", href: "https://example.com" }
  },
  // 每项支持 id、title、type（novel/game）、description、cover、href、actionLabel。
  // 例如：{ id: "my-novel", title: "作品标题", type: "novel", description: "简介", cover: "", href: "novels/my-novel/", actionLabel: "阅读作品" }
  works: []
};
