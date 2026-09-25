// Producer IDs are opaque path segments; array order is the reading order.
export function novelFiles(release) {
  return {
    ...release, readme: { file: 'README.md' },
    volumes: release.volumes.map(volume => ({
      ...volume, readme: { file: `text/${volume.id}/README.md` },
      chapters: volume.chapters.map(chapter => ({ ...chapter, file: `text/${volume.id}/${chapter.id}.md` }))
    }))
  };
}

export function novelDocuments(release) {
  return [
    { id: null, kind: 'readme', title: release.title, file: release.readme.file, volumeId: null },
    ...release.volumes.flatMap(volume => [
      { id: volume.id, kind: 'readme', title: volume.title, file: volume.readme.file, volumeId: volume.id, volumeTitle: volume.title },
      ...volume.chapters.map(chapter => ({ ...chapter, id: `${volume.id}/${chapter.id}`, kind: 'chapter', volumeId: volume.id, volumeTitle: volume.title }))
    ])
  ];
}
export function receivedProjects(projects, releases) {
  return projects.map(project => {
    const release = releases.find(item => item.project.release === project.release)?.manifest;
    if (release?.kind !== 'novel') return project;
    return { ...project, id: release.id, slug: release.id, title: `${release.title}.txt`, iconPath: project.release + release.icon, reader: { ...release, documents: novelDocuments(release) } };
  });
}
