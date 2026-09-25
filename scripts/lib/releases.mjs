import fs from 'node:fs/promises';
import path from 'node:path';
import { listFiles, withinDirectory, fingerprint } from './files.mjs';
import { headingTitle } from '../../src/shared/novel/parser.js';
import { novelFiles } from '../../src/shared/novel/model.js';

// Read producer data as supplied. Naming, order and content validation belong upstream.
export async function readNovel(directory, read = file => fs.readFile(withinDirectory(directory, file), 'utf8')) {
  const manifest = novelFiles(JSON.parse(await read('release.json')));
  const title = async file => headingTitle(await read(file));
  return { ...manifest, title: await title(manifest.readme.file), volumes: await Promise.all(manifest.volumes.map(async volume => ({
    ...volume, title: await title(volume.readme.file),
    chapters: await Promise.all(volume.chapters.map(async chapter => ({ ...chapter, title: await title(chapter.file) })))
  }))) };
}
export async function receiveReleases(root, projects) {
  const results = [];
  for (const project of projects) {
    if (!project.release) continue;
    const releaseRoot = path.join(root, 'releases');
    const directory = withinDirectory(releaseRoot, path.relative(releaseRoot, withinDirectory(root, project.release)));
    const files = await listFiles(directory);
    const manifest = project.category === 'novel' ? await readNovel(directory) : JSON.parse(await fs.readFile(path.join(directory, 'release.json'), 'utf8'));
    if (manifest.kind === 'web') withinDirectory(directory, manifest.entry);
    results.push({ project, manifest, ...await fingerprint(directory, files) });
  }
  return results;
}
