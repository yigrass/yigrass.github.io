// Portable Node 24+ validator. Copy this directory as a unit; no npm install required.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseMarkdown, references } from './markdown.mjs';
const schema = JSON.parse(await fs.readFile(new URL('./release.schema.json', import.meta.url), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function validateShape(value, rule = schema, at = 'release') {
  if (rule.$ref) rule = schema.$defs[rule.$ref.split('/').at(-1)];
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
  const ids = new Set(), documents = [manifest.readme], documentPaths = new Set();
  for (const volume of manifest.volumes) {
    for (const item of [volume, ...volume.chapters]) {
      if (ids.has(item.id)) throw new Error(`Duplicate document route id: ${item.id}`);
      ids.add(item.id);
    }
    documents.push(volume.readme, ...volume.chapters);
  }
  for (const item of documents) {
    safeRelative(item.file);
    if (documentPaths.has(item.file.toLowerCase())) throw new Error(`Duplicate document file: ${item.file}`);
    documentPaths.add(item.file.toLowerCase()); accepted.add(item.file);
  }
  async function image(file, icon = false) {
    safeRelative(file); accepted.add(file);
    const bytes = await read(file), extension = path.extname(file);
    const valid = extension === '.png' ? bytes.length >= 33 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) : ['.jpg', '.jpeg'].includes(extension) ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : extension === '.webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (!valid) throw new Error(`Image signature does not match extension: ${file}`);
    if (icon && (!['16', '32', '48', '64'].includes(String(bytes.readUInt32BE(16))) || bytes.readUInt32BE(16) !== bytes.readUInt32BE(20))) throw new Error('Novel icon must be a square PNG of 16, 32, 48 or 64 pixels');
  }
  await image(manifest.icon, true);
  for (const item of documents) {
    const text = decodeText(await read(item.file), item.file).trim();
    if (!text) throw new Error(`Empty Markdown document: ${item.file}`);
    for (const ref of references(parseMarkdown(text))) {
      if (ref.kind !== 'local') continue;
      safeRelative(ref.value);
      if (ref.type === 'image') await image(ref.value);
      else if (!documents.some(document => document.file === ref.value)) throw new Error(`Link must target a published Markdown document: ${ref.value}`);
    }
  }
  for (const file of files) if (!accepted.has(file)) throw new Error(`Unreferenced or non-public file: ${file}`);
  return { manifest, ...await fingerprint(root, files) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node validate.mjs <novel-dist-directory> [expected-id]');
    const result = await validateNovel(process.argv[2], process.argv[3]);
    console.log(JSON.stringify({ valid: true, id: result.manifest.id, volumes: result.manifest.volumes.length, chapters: result.manifest.volumes.reduce((count, volume) => count + volume.chapters.length, 0), ...result }, null, 2));
  } catch (error) { console.error(`Novel validation failed: ${error.message}`); process.exitCode = 1; }
}
