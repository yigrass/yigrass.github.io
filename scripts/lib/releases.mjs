import fs from 'node:fs/promises';
import path from 'node:path';
import { validateNovel, listFiles, safeRelative, decodeText, fingerprint } from '../../contracts/novel-release-v1/validate.mjs';

export async function validateReleases(root, projects) {
  if (!Array.isArray(projects)) throw new Error('Project catalog must be an array');
  const ids = new Set(), results = [];
  for (const project of projects) {
    if (!/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id)) throw new Error(`Invalid or duplicate project: ${project.id}`);
    ids.add(project.id);
    if (!project.slug) {
      if (!/^https?:\/\//.test(project.url || '')) throw new Error(`Invalid external project URL: ${project.id}`);
      continue;
    }
    if (project.release !== `releases/${project.id}/`) throw new Error(`Release must be releases/${project.id}/`);
    const directory = path.join(root, project.release);
    if (project.category === 'novel') results.push({ project, ...await validateNovel(directory, project.id) });
    else {
      const files = await listFiles(directory);
      const manifest = JSON.parse(decodeText(await fs.readFile(path.join(directory, 'release.json')), 'release.json'));
      if (manifest.schemaVersion !== 1 || manifest.kind !== 'web' || manifest.id !== project.id || typeof manifest.title !== 'string' || !manifest.title.trim()) throw new Error(`Invalid web release: ${project.id}`);
      safeRelative(manifest.entry);
      if (!manifest.entry.endsWith('.html') || !files.includes(manifest.entry)) throw new Error(`Missing HTML entry: ${project.id}`);
      results.push({ project, manifest, ...await fingerprint(directory, files) });
    }
  }
  return results;
}
