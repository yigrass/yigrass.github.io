// Portable Node 24+ validator. Copy this directory as a unit; no npm install required.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const schema = JSON.parse(await fs.readFile(new URL('./release.schema.json', import.meta.url), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function validateShape(value, rule = schema, at = 'release') {
  const fail = message => { throw new Error(`${at}: ${message}`); };
  if (Object.hasOwn(rule, 'const') && value !== rule.const) fail(`expected ${JSON.stringify(rule.const)}`);
  if (rule.enum && !rule.enum.includes(value)) fail(`expected one of ${rule.enum.join(', ')}`);
  if (rule.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected object');
    for (const key of rule.required || []) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const key of Object.keys(value)) {
      if (!Object.hasOwn(rule.properties || {}, key)) { if (rule.additionalProperties === false) fail(`unknown field ${key}`); }
      else validateShape(value[key], rule.properties[key], `${at}.${key}`);
    }
  }
  if (rule.type === 'array') {
    if (!Array.isArray(value)) fail('expected array');
    if (value.length < (rule.minItems || 0)) fail(`requires at least ${rule.minItems} item(s)`);
    value.forEach((item, index) => validateShape(item, rule.items, `${at}[${index}]`));
  }
  if (rule.type === 'string') {
    if (typeof value !== 'string') fail('expected string');
    if (value.trim().length < (rule.minLength || 0)) fail('must not be blank');
    if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail('invalid format');
  }
  if (rule.type === 'integer' && (!Number.isInteger(value) || value < rule.minimum)) fail(`expected integer >= ${rule.minimum}`);
}
export function safeRelative(file) {
  if (typeof file !== 'string' || !file || file.split('/').some(segment => !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segment) || segment.endsWith('.') || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) throw new Error(`Unsafe package path: ${file}`);
  return file;
}
export async function listFiles(directory) {
  const root = path.resolve(directory), files = [], seen = new Set();
  async function visit(dir, relative = '') {
    const stat = await fs.lstat(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Expected ordinary directory: ${dir}`);
    for (const name of (await fs.readdir(dir)).sort()) {
      const item = relative ? `${relative}/${name}` : name;
      safeRelative(item);
      const folded = item.toLowerCase();
      if (seen.has(folded)) throw new Error(`Case-insensitive path collision: ${item}`);
      seen.add(folded);
      const absolute = path.join(dir, name), entry = await fs.lstat(absolute);
      if (entry.isSymbolicLink()) throw new Error(`Links are not accepted: ${item}`);
      if (entry.isDirectory()) await visit(absolute, item);
      else if (entry.isFile()) files.push(item);
      else throw new Error(`Unsupported file: ${item}`);
    }
  }
  await visit(root);
  return files.sort();
}
export function decodeText(bytes, file) {
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error(`Invalid UTF-8: ${file}`); }
  if (text.includes('\0')) throw new Error(`NUL characters are not allowed: ${file}`);
  return text;
}
export async function fingerprint(directory, files) {
  const records = [];
  for (const file of files) {
    const bytes = await fs.readFile(path.join(directory, file));
    records.push({ path: file, bytes: bytes.length, sha256: sha256(bytes) });
  }
  return { files: records, digest: sha256(JSON.stringify(records)) };
}
export async function validateNovel(directory, expectedId) {
  const root = path.resolve(directory), files = await listFiles(root);
  const read = file => fs.readFile(path.join(root, file));
  const manifest = JSON.parse(decodeText(await read('release.json'), 'release.json'));
  validateShape(manifest);
  if (expectedId && manifest.id !== expectedId) throw new Error(`Expected novel id ${expectedId}, received ${manifest.id}`);
  const accepted = new Set(['release.json', 'LICENSE.txt', 'NOTICE.txt']);
  const chapterIds = new Set(), chapterPaths = new Set();
  for (const chapter of manifest.chapters) {
    safeRelative(chapter.file);
    if (chapterIds.has(chapter.id) || chapterPaths.has(chapter.file)) throw new Error(`Duplicate chapter id or file: ${chapter.id}`);
    chapterIds.add(chapter.id); chapterPaths.add(chapter.file); accepted.add(chapter.file);
    const text = decodeText(await read(chapter.file), chapter.file).replace(/\r\n?/g, '\n').trim();
    if (!text) throw new Error(`Empty chapter: ${chapter.file}`);
    const paragraphs = text.split(/\n[\t ]*\n+/).length;
    for (const illustration of chapter.illustrations || []) {
      safeRelative(illustration.file); accepted.add(illustration.file);
      if (illustration.afterParagraph > paragraphs) throw new Error(`Illustration exceeds paragraph count: ${chapter.id}`);
      const bytes = await read(illustration.file), extension = path.extname(illustration.file);
      const valid = extension === '.png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) : ['.jpg', '.jpeg'].includes(extension) ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
      if (!valid) throw new Error(`Image signature does not match extension: ${illustration.file}`);
    }
  }
  for (const file of files) if (!accepted.has(file)) throw new Error(`Unreferenced or non-public file: ${file}`);
  return { manifest, ...await fingerprint(root, files) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node validate.mjs <novel-dist-directory> [expected-id]');
    const result = await validateNovel(process.argv[2], process.argv[3]);
    console.log(JSON.stringify({ valid: true, id: result.manifest.id, chapters: result.manifest.chapters.length, ...result }, null, 2));
  } catch (error) { console.error(`Novel validation failed: ${error.message}`); process.exitCode = 1; }
}
