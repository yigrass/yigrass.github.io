import { $, create } from '../shared/dom.js';
import { createDesktopRoutes } from '../routing/history.js';
import { createWindowManager } from './window-manager.js';
import { createStartMenu } from './start-menu.js';
import { createPreferences } from './preferences.js';
import { initializeWallpaper } from './wallpaper.js';
import { startClock } from './taskbar.js';
import { createProfile } from '../apps/my-computer/index.js';
import { createExplorer } from '../apps/file-explorer/index.js';
import { createSettings } from '../apps/system-settings/index.js';
import { renderProject } from '../apps/project-viewer/index.js';
import { projectIcon, projectWindowId, projectDocumentRoute } from '../apps/registry.js';

export function bootDesktop(config) {
  const siteRoot = new URL('.', document.baseURI);
  const base = $('base') || create('base');
  base.href = siteRoot.href;
  if (!base.parentNode) document.head.prepend(base);
  const desktopRoutes = createDesktopRoutes({ config, baseURI: siteRoot.href, location: window.location, history: window.history });
  document.title = config.siteTitle;
  $('#start-label').textContent = config.startLabel;
  $('#menu-brand').textContent = config.menuBrand;
  const { preferences, applyPreferences } = createPreferences(config);
  const windowTypes = {};
  const titleOf = id => config.menuLabels?.[id] || windowTypes[id].title;
  let restoringAddress = false;
  const manager = createWindowManager({ windowTypes, titleOf, menuBrand: config.menuBrand, onAddressChange: syncAddress });
  function syncAddress(mode = 'replace') {
    const id = manager.getActiveId();
    const drive = id === 'works' ? manager.getWindow('works')?.content?.getLocation() : null;
    const documentId = manager.getWindow(id)?.content?.getDocumentId?.();
    const projectId = id?.startsWith('project-') ? id.slice('project-'.length) : null;
    document.title = id ? `${titleOf(id)} — ${config.siteTitle}` : config.siteTitle;
    if (!restoringAddress) desktopRoutes.sync(drive ? `drive-${drive}` : projectId ? projectDocumentRoute(projectId, documentId) : id, mode);
  }
  function openProject(id) {
    if (!desktopRoutes.getProject(id)) return;
    const windowId = projectWindowId(id);
    manager.openWindow(windowId, manager.hasWindow(windowId) ? 'replace' : 'push');
  }
  Object.assign(windowTypes, {
    profile: { title: '我的电脑', icon: 'calming/this_computer', render: createProfile({ config, titleOf }), status: () => '个人系统属性' },
    works: { title: '资源管理器', icon: 'calming/folder_dark', render: createExplorer({ config, desktopRoutes, titleOf, getActiveId: manager.getActiveId, syncAddress, openProject }), status: () => `${config.explorer.drives.length} 个对象` },
    settings: { title: '系统设置', icon: 'calming/tools', render: createSettings({ preferences, applyPreferences }), status: () => '设置即时生效，仅保存于此浏览器' }
  });
  for (const project of desktopRoutes.projects) {
    const id = projectWindowId(project.id);
    windowTypes[id] = {
      title: project.title, icon: projectIcon(project),
      render: (body, setStatus) => renderProject(body, project, {
        setStatus, activate: () => manager.activate(id), isActive: () => manager.getActiveId() === id,
        initialDocumentId: desktopRoutes.current()?.windowId === id ? desktopRoutes.current().documentId || null : null,
        address: documentId => desktopRoutes.address(projectDocumentRoute(project.id, documentId)),
        setMinimumWidth: width => manager.setMinimumWidth(id, width),
        onNavigate: mode => { if (manager.getActiveId() === id) syncAddress(mode); }
      }),
      status: () => '就绪'
    };
  }
  const { closeMenu } = createStartMenu({ windowTypes, titleOf, openWindow: manager.openWindow, hasWindow: manager.hasWindow });
  function restoreAddress() {
    restoringAddress = true;
    closeMenu();
    try {
      const route = desktopRoutes.current();
      if (route) {
        manager.openWindow(route.windowId);
        if (route.windowId === 'works') manager.getWindow('works').content.navigate(route.driveId || null, 'replace');
        else manager.getWindow(route.windowId)?.content?.navigateDocument?.(route.documentId || null, 'restore');
      } else manager.hideAll();
    } finally { restoringAddress = false; }
    syncAddress();
  }
  initializeWallpaper(config);
  startClock();
  window.addEventListener('popstate', restoreAddress);
  restoreAddress();
  return manager;
}
