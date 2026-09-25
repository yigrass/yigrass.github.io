import { createDesktopRouteCatalog } from './catalog.js';
export const createDesktopRoutes = ({ config, baseURI, location, history }) => {
  const { entries, projects, byId, byPath } = createDesktopRouteCatalog(config);
  const root = new URL(".", baseURI);
  const home = new URL("./", root);
  home.search = "";
  home.hash = "";
  const homeAddress = home.href;
  const address = (id) => {
    const entry = byId.get(id);
    if (!entry) return homeAddress;
    return new URL(entry.path, root).href;
  };
  const current = () => {
    const url = new URL(location.href);
    let path;
    {
      if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname)) return null;
      path = decodeURIComponent(url.pathname.slice(root.pathname.length));
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
