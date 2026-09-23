(() => {
  "use strict";
  // Shared by the browser and static-entry generator; configuration is the source of paths.
  window.createDesktopRouteCatalog = (config) => {
    const entries = [], projects = [], byId = new Map(), byPath = new Map();
    const segment = (value) => {
      if (typeof value !== "string" || !/^[a-z][a-z0-9-]*$/.test(value)) throw new Error("Invalid route segment: " + value);
      return value;
    };
    const addPath = (path, entry) => {
      if (!/^(?:[a-z][a-z0-9-]*\/)+$/.test(path) || byPath.has(path)) throw new Error("Invalid or duplicate route: " + path);
      byPath.set(path, entry);
    };
    const add = (entry) => {
      if (byId.has(entry.id)) throw new Error("Duplicate route id: " + entry.id);
      byId.set(entry.id, entry);
      addPath(entry.path, entry);
      entries.push(entry);
    };
    for (const id of ["profile", "works", "settings"]) {
      add({ id, windowId: id, path: segment(config.applicationRoutes[id]) + "/" });
    }
    for (const drive of config.explorer?.drives || []) {
      add({ id: "drive-" + segment(drive.id), windowId: "works", driveId: drive.id, path: byId.get("works").path + segment(drive.slug) + "/" });
    }
    for (const project of config.works || []) {
      if (!project.slug) continue; // External links do not create local entry pages.
      const drive = byId.get("drive-" + project.driveId);
      if (!drive || !["novel", "game", "utility"].includes(project.category) || typeof project.title !== "string" || !project.title.trim()) throw new Error("Invalid project: " + project.id);
      const id = "project-" + segment(project.id);
      add({ id, windowId: id, projectId: project.id, driveId: project.driveId, path: drive.path + segment(project.slug) + "/" });
      projects.push({ ...project, title: project.title.trim() });
    }
    return { entries, projects, byId, byPath };
  };

  window.createDesktopRoutes = ({ config, baseURI, location, history }) => {
    const { entries, projects, byId, byPath } = window.createDesktopRouteCatalog(config);
    const root = new URL(".", baseURI);
    const localFile = location.protocol === "file:";
    const home = new URL(localFile ? location.href : "./", root);
    home.search = "";
    home.hash = "";
    const homeAddress = localFile && home.pathname !== new URL("index.html", root).pathname ? home.href + "#/" : home.href;
    const address = (id) => {
      const entry = byId.get(id);
      if (!entry) return homeAddress;
      return localFile ? home.href + "#/" + entry.path : new URL(entry.path, root).href;
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
    const knownAddresses = new Set([homeAddress, ...entries.map(entry => address(entry.id))]);
    const sync = (id, mode = "replace") => {
      const target = address(id);
      const state = history.state && typeof history.state === "object" ? history.state : {};
      if (mode === "push" && target !== location.href) {
        // Window focus changes the visible URL, but not the previous deliberate visit.
        if (knownAddresses.has(state.desktopVisit)) history.replaceState(state, "", state.desktopVisit);
        history.pushState({ desktopVisit: target }, "", target);
      } else if (target !== location.href || !state.desktopVisit) {
        history.replaceState({ ...state, desktopVisit: state.desktopVisit || target }, "", target);
      }
    };
    return { projects, getProject: id => projects.find(project => project.id === id), address, current, sync };
  };
})();
