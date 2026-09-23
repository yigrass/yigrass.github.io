import fs from 'node:fs/promises';
import path from 'node:path';
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
