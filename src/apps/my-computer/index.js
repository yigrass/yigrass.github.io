import { create, safeURL, pixelIcon } from '../../shared/dom.js';
export function createProfile({ config, titleOf }) {
  function profileContent(body) {
    body.classList.add("properties-body");
    const profile = config.profile || {};
    const tabs = create("div", "property-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "个人系统属性");
    const pages = create("div", "property-pages");
    const buttons = [];
    const panels = [];
    const selectTab = (index, focus = false) => {
      buttons.forEach((button, position) => {
        button.setAttribute("aria-selected", String(position === index));
        button.tabIndex = position === index ? 0 : -1;
        panels[position].hidden = position !== index;
      });
      if (focus) buttons[index].focus();
    };
    for (const [index, [key, name]] of [["general", "常规"], ["about", "个人介绍"], ["contact", "联系信息"]].entries()) {
      const tab = create("button", "property-tab", name);
      tab.type = "button";
      tab.id = `property-tab-${key}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `property-panel-${key}`);
      tab.addEventListener("click", () => selectTab(index));
      tab.addEventListener("keydown", (event) => {
        const next = { ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2 }[event.key];
        if (next !== undefined) { event.preventDefault(); selectTab(next, true); }
      });
      const panel = create("section", "property-panel");
      panel.id = `property-panel-${key}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tab.id);
      panel.tabIndex = 0;
      tabs.append(tab);
      pages.append(panel);
      buttons.push(tab);
      panels.push(panel);
    }
    const header = create("div", "properties-heading");
    const avatarURL = safeURL(profile.avatar);
    const avatar = avatarURL ? create("img", "property-avatar") : pixelIcon("calming/this_computer", "property-computer");
    if (avatarURL) { avatar.src = avatarURL; avatar.alt = `${profile.nickname || "个人"}的头像`; }
    const heading = create("div");
    heading.append(create("h1", "", titleOf("profile")), create("p", "", "个人系统属性"));
    header.append(avatar, heading);
    panels[0].append(header);
    const identity = create("fieldset", "property-group");
    identity.append(create("legend", "", "注册信息"));
    const fields = create("dl", "property-fields");
    for (const [label, value] of [["昵称", profile.nickname], ["个性签名", profile.signature]]) {
      fields.append(create("dt", "", label), create("dd", value ? "" : "property-placeholder", value || "—"));
    }
    identity.append(fields);
    panels[0].append(identity);
    const about = create("fieldset", "property-group");
    about.append(create("legend", "", "个人介绍"), create("p", profile.introduction ? "profile-intro" : "property-placeholder", profile.introduction || "暂未填写"));
    panels[1].append(about);
    const contact = create("fieldset", "property-group");
    contact.append(create("legend", "", "联系方式与个人链接"));
    const links = create("ul", "property-links");
    for (const link of profile.links || []) {
      const href = safeURL(link.href);
      if (!href) continue;
      const item = create("li");
      const anchor = create("a", "", link.label || href);
      anchor.href = href;
      item.append(anchor);
      links.append(item);
    }
    contact.append(links.childElementCount ? links : create("p", "property-placeholder", "暂未填写"));
    panels[2].append(contact);
    body.append(tabs, pages);
    selectTab(0);
  }
  return profileContent;
}
