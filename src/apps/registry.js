export const projectCategories = {
  novel: { icon: 'v1.2.0/text-file' },
  game: { icon: 'v1.1.0/cdrom' },
  utility: { icon: 'v1.1.0/control-panel' }
};
export const projectWindowId = id => `project-${id}`;
export const projectIcon = project => project.iconPath || projectCategories[project.category].icon;
export const projectDocumentRoute = (projectId, documentId) => projectWindowId(projectId) + (documentId ? `/document/${documentId}` : '');
