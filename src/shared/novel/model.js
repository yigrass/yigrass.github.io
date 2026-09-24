// Runtime index is derived from a validated received release during the build.
export function novelDocuments(release) {
  return [
    { id: null, kind: 'readme', title: release.title, file: release.readme.file, volumeId: null },
    ...release.volumes.flatMap(volume => [
      { id: volume.id, kind: 'readme', title: volume.title, file: volume.readme.file, volumeId: volume.id },
      ...volume.chapters.map(chapter => ({ ...chapter, kind: 'chapter', volumeId: volume.id }))
    ])
  ];
}
export function receivedProjects(projects, releases) {
  return projects.map(project => {
    const release = releases.find(item => item.project.id === project.id)?.manifest;
    if (release?.kind !== 'novel') return project;
    return { ...project, iconPath: project.release + release.icon, reader: { title: release.title, documents: novelDocuments(release).map(({ file, ...document }) => document) } };
  });
}
