import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
export function withinDirectory(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error(`Path escapes directory: ${relative}`);
  return target;
}
export async function listFiles(directory) {
  const files = [];
  async function visit(relative = '') {
    const current = relative ? withinDirectory(directory, relative) : directory;
    if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Directory link is outside the package contract: ${relative}`);
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const file = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Package links are not followed: ${file}`);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  await visit(); return files.sort();
}
export async function fingerprint(directory, files) {
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  const records = await Promise.all(files.map(async file => {
    const bytes = await fs.readFile(withinDirectory(directory, file));
    return { path: file, bytes: bytes.length, sha256: digest(bytes) };
  }));
  return { files: records, digest: digest(JSON.stringify(records)) };
}
export async function assertOwnedDirectory(root, name) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== path.resolve(root) || !['dist', '.dist-build', '.test-work'].includes(name)) throw new Error(`Unsafe generated directory: ${target}`);
  try { if ((await fs.lstat(target)).isSymbolicLink()) throw new Error(`Generated directory cannot be a link: ${target}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  return target;
}
export async function writeFile(root, relative, content) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep)) throw new Error(`Output escapes directory: ${relative}`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}
