import { create, safeURL, pixelIcon } from '../../shared/dom.js';
import { projectCategories, projectWindowId, projectIcon } from '../registry.js';
import { statusText } from '../../shared/status.js';
export function createExplorer({ config, desktopRoutes, titleOf, getActiveId, syncAddress, openProject }) {
  function worksContent(body, setStatus) {
    body.classList.add("explorer-body");
    const drives = config.explorer?.drives || [];
    const categories = projectCategories;
    const projects = (Array.isArray(config.works) ? config.works : [])
      .filter((project) => project && Object.hasOwn(categories, project.category) && typeof project.title === "string" && project.title.trim() && (desktopRoutes.getProject(project.id) || safeURL(project.url)))
      .map((project) => ({ ...project, title: project.title.trim(), internal: Boolean(desktopRoutes.getProject(project.id)), url: desktopRoutes.getProject(project.id) ? desktopRoutes.address(projectWindowId(project.id)) : safeURL(project.url) }));
    const rootLabel = titleOf("profile");
    const driveLabel = (drive) => `${drive.label} (${drive.letter}:)`;
    const driveIcon = (drive, className) => pixelIcon(drive.type === "flash-drive" ? "v1.2.0/flash-drive" : `v1.1.0/${["hard-disk", "floppy", "cdrom"].includes(drive.type) ? drive.type : "hard-disk"}`, className);
    let currentLocation = null;
    const toolbar = create("div", "explorer-toolbar");
    toolbar.setAttribute("role", "group");
    toolbar.setAttribute("aria-label", "资源管理器工具栏");
    function tool(label, icon, action) {
      const button = create("button", "classic-button explorer-tool");
      button.type = "button";
      button.title = label;
      button.append(pixelIcon(icon), create("span", "", label));
      button.addEventListener("click", action);
      toolbar.append(button);
      return button;
    }
    const up = tool("向上", "v1.1.0/up", () => navigate(null));
    const addressRow = create("label", "explorer-address");
    addressRow.htmlFor = "explorer-address";
    const address = create("select");
    address.id = "explorer-address";
    const rootOption = create("option", "", rootLabel);
    rootOption.value = "";
    address.append(rootOption);
    for (const drive of drives) {
      const option = create("option", "", `${drive.letter}:\\ — ${drive.label}`);
      option.value = drive.id;
      address.append(option);
    }
    address.addEventListener("change", () => navigate(address.value || null));
    addressRow.append(create("span", "", "地址"), address);
    const panes = create("div", "explorer-panes");
    const sidebar = create("nav", "explorer-sidebar");
    sidebar.id = "explorer-folders";
    sidebar.setAttribute("aria-label", "文件夹导航");
    sidebar.append(create("div", "explorer-pane-label", "文件夹"));
    const treeRoot = create("div", "explorer-tree-root");
    const expand = create("button", "tree-expand", "−");
    expand.type = "button";
    expand.setAttribute("aria-expanded", "true");
    expand.setAttribute("aria-controls", "explorer-drive-tree");
    expand.setAttribute("aria-label", "收起驱动器列表");
    const rootButton = create("button", "tree-location");
    rootButton.type = "button";
    rootButton.append(pixelIcon("v1.1.0/computer"), create("span", "", rootLabel));
    rootButton.addEventListener("click", () => navigate(null));
    treeRoot.append(expand, rootButton);
    const tree = create("ul", "explorer-drive-tree");
    tree.id = "explorer-drive-tree";
    const locationButtons = new Map([[null, rootButton]]);
    for (const drive of drives) {
      const item = create("li");
      const button = create("button", "tree-location");
      button.type = "button";
      button.title = driveLabel(drive);
      button.append(driveIcon(drive), create("span", "", driveLabel(drive)));
      button.addEventListener("click", () => navigate(drive.id));
      item.append(button);
      tree.append(item);
      locationButtons.set(drive.id, button);
    }
    expand.addEventListener("click", () => {
      tree.hidden = !tree.hidden;
      expand.textContent = tree.hidden ? "+" : "−";
      expand.setAttribute("aria-expanded", String(!tree.hidden));
      expand.setAttribute("aria-label", `${tree.hidden ? "展开" : "收起"}驱动器列表`);
    });
    sidebar.append(treeRoot, tree);
    const content = create("section", "explorer-files");
    content.tabIndex = 0;
    panes.append(sidebar, content);
    body.append(toolbar, addressRow, panes);
    function navigate(id, routeMode = "push") {
      if (id !== null && !drives.some((drive) => drive.id === id)) return;
      if (currentLocation === id) return;
      currentLocation = id;
      render();
      if (getActiveId() === "works") syncAddress(routeMode);
    }
    function render() {
      const id = currentLocation;
      const drive = drives.find((item) => item.id === id);
      const entries = drive ? projects.filter((project) => project.driveId === drive.id) : [];
      const label = drive ? driveLabel(drive) : rootLabel;
      // Moving into a drive removes its root tile; retain keyboard focus in the pane.
      const restoreFocus = content.contains(document.activeElement);
      up.disabled = !drive;
      address.value = id || "";
      for (const [location, button] of locationButtons) {
        if (location === id) button.setAttribute("aria-current", "location");
        else button.removeAttribute("aria-current");
      }
      content.replaceChildren();
      content.setAttribute("aria-label", `${label}内容`);
      const caption = create("div", "explorer-location-heading");
      caption.append(drive ? driveIcon(drive) : pixelIcon("v1.1.0/computer"), create("h1", "", label));
      content.append(caption);
      if (drive && entries.length) {
        const grid = create("div", "drive-grid");
        for (const project of entries) {
          const name = project.title;
          const tile = create("a", "drive-tile project-tile");
          tile.href = project.url;
          if (project.internal) {
            tile.addEventListener("click", (event) => {
              if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              openProject(project.id);
            });
          } else {
            tile.target = "_blank";
            tile.rel = "noopener noreferrer";
          }
          tile.title = `打开${name}${project.internal ? "" : "（新标签页）"}`;
          tile.setAttribute("aria-label", tile.title);
          tile.append(pixelIcon(projectIcon(project), "drive-icon"), create("span", "", name));
          grid.append(tile);
        }
        content.append(grid);
      } else if (drive) {
        const empty = create("div", "explorer-empty");
        empty.append(create("p", "", "此文件夹为空。"));
        content.append(empty);
      } else {
        const grid = create("div", "drive-grid");
        for (const item of drives) {
          const tile = create("button", "drive-tile");
          tile.type = "button";
          tile.title = `打开${driveLabel(item)}`;
          tile.append(driveIcon(item, "drive-icon"), create("span", "", driveLabel(item)));
          tile.addEventListener("click", () => navigate(item.id));
          grid.append(tile);
        }
        content.append(grid);
      }
      setStatus(statusText(`${drive ? entries.length : drives.length} 个对象`, drive ? `${drive.letter}:\\` : ''));
      if (restoreFocus) content.focus({ preventScroll: true });
    }
    render();
    return { getLocation: () => currentLocation, navigate };
  }

  return worksContent;
}
