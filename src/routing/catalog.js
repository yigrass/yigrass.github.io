// Shared by the browser and static-entry generator; configuration is the source of paths.
export const createDesktopRouteCatalog = (config) => {
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

