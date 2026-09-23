// Project addresses identify the foreground content; window state stays in app.js.
(() => {
  "use strict";
  window.createProjectRoutes = ({ works, baseURI, location, history }) => {
    const root = new URL(".", baseURI);
    const localFile = location.protocol === "file:";
    const home = new URL(localFile ? location.href : "./", root);
    home.search = "";
    home.hash = "";
    // file: history may only change the current file's fragment, never its path.
    const homeAddress = localFile && home.pathname !== new URL("index.html", root).pathname ? `${home.href}#/` : home.href;
    const byId = new Map();
    const byPath = new Map();
    for (const project of Array.isArray(works) ? works : []) {
      if (!project || !/^[a-z][a-z0-9-]*$/.test(project.id || "") ||
          typeof project.title !== "string" || !project.title.trim() ||
          !["novel", "game", "utility"].includes(project.category) ||
          !/^(?:[a-z0-9-]+\/)+$/.test(project.route || "") ||
          byId.has(project.id) || byPath.has(project.route)) continue;
      const entry = { ...project, title: project.title.trim() };
      byId.set(entry.id, entry);
      byPath.set(entry.route, entry);
    }
    const address = (id) => {
      const project = byId.get(id);
      if (!project) return homeAddress;
      return localFile ? `${home.href}#/${project.route}` : new URL(project.route, root).href;
    };
    const current = () => {
      const url = new URL(location.href);
      let path;
      if (localFile && url.hash.startsWith("#/")) path = url.hash.slice(2);
      else {
        if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
        path = url.pathname.slice(root.pathname.length);
      }
      path = path.replace(/index\.html$/, "");
      if (path && !path.endsWith("/")) path += "/";
      return byPath.get(path) || null;
    };
    const sync = (id, mode = "replace") => {
      const target = address(id);
      const state = history.state && typeof history.state === "object" ? history.state : {};
      if (mode === "push" && target !== location.href) {
        // Transient window focus can replace the visible URL. Preserve the last
        // deliberate content visit before adding the next visit to browser history.
        const visit = state.desktopVisit;
        if ([homeAddress, ...[...byId.keys()].map(address)].includes(visit)) {
          history.replaceState(state, "", visit);
        }
        history.pushState({ desktopVisit: target }, "", target);
      } else if (target !== location.href || !state.desktopVisit) {
        history.replaceState({ ...state, desktopVisit: state.desktopVisit || target }, "", target);
      }
    };
    return { projects: [...byId.values()], get: (id) => byId.get(id), address, current, sync };
  };
})();
