export const projectCategories = {
  novel: { icon: 'calming/text_file' },
  game: { icon: 'calming/cd_drive' },
  utility: { icon: 'calming/tools' }
};
export const projectWindowId = id => `project-${id}`;
export const projectIcon = project => project.iconPath || projectCategories[project.category].icon;
export const projectDocumentRoute = (projectId, documentId) => projectWindowId(projectId) + (documentId ? `/document/${documentId}` : '');
