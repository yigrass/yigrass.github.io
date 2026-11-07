import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { listFiles, fingerprint, withinDirectory } from '../../scripts/lib/files.mjs';
import { headingTitle, parseMarkdown } from '../../src/shared/novel/parser.js';
const root = fileURLToPath(new URL('../../', import.meta.url));
const qa = fileURLToPath(new URL('./', import.meta.url));
const dir = path.join(root, 'content/cacophony');
const schema = JSON.parse(await fs.readFile(path.join(root, 'contracts/novel-release-v4/release.schema.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(dir, 'release.json'), 'utf8'));
// Scoped evaluator for every assertion keyword in this exact contract, not a general JSON Schema implementation.
function validate(value, rule, label) {
  for (const key of Object.keys(rule)) assert.ok(['$schema', '$defs', '$ref', 'title', 'description', 'type', 'required', 'additionalProperties', 'properties', 'const', 'minLength', 'pattern', 'minItems', 'items'].includes(key), `Unsupported schema keyword: ${key}`);
  if (rule.$ref) { assert.ok(rule.$ref.startsWith('#/$defs/')); return validate(value, schema.$defs[rule.$ref.slice(8)], label); }
  if ('const' in rule) assert.deepEqual(value, rule.const, label);
  if (rule.type === 'object') {
    assert.ok(value && typeof value === 'object' && !Array.isArray(value), label);
    for (const key of rule.required || []) assert.ok(Object.hasOwn(value, key), `${label}.${key} required`);
    for (const [key, val] of Object.entries(value)) {
      if (rule.additionalProperties === false) assert.ok(Object.hasOwn(rule.properties, key), `${label}.${key} unexpected`);
      if (rule.properties?.[key]) validate(val, rule.properties[key], `${label}.${key}`);
    }
  } else if (rule.type === 'array') {
    assert.ok(Array.isArray(value), label);
    assert.ok(value.length >= (rule.minItems || 0), label);
    value.forEach((item, i) => validate(item, rule.items, `${label}[${i}]`));
  } else if (rule.type === 'string') {
    assert.equal(typeof value, 'string', label);
    assert.ok(value.length >= (rule.minLength || 0), label);
    if (rule.pattern) assert.match(value, new RegExp(rule.pattern), label);
  }
}
validate(manifest, schema, 'release');
const segment = id => { assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/); assert.ok(!['.', '..', 'README'].includes(id)); };
segment(manifest.id);
const files = await listFiles(dir);
assert.deepEqual((await fs.readdir(dir)).sort(), ['README.md', 'images', 'release.json', 'text']);
const docs = ['README.md'];
const volumeIds = new Set();
const chapterOrder = [];
for (const volume of manifest.volumes) {
  segment(volume.id); assert.ok(!volumeIds.has(volume.id)); volumeIds.add(volume.id);
  docs.push(`text/${volume.id}/README.md`);
  const chapters = new Set();
  for (const chapter of volume.chapters) {
    segment(chapter.id); assert.ok(!chapters.has(chapter.id)); chapters.add(chapter.id);
    docs.push(`text/${volume.id}/${chapter.id}.md`); chapterOrder.push(`${volume.id}/${chapter.id}`);
  }
}
const documents = [];
const references = [];
for (const file of docs) {
  const source = new TextDecoder('utf-8', { fatal: true }).decode(await fs.readFile(withinDirectory(dir, file)));
  const title = headingTitle(source); assert.ok(title.trim(), `Missing H1: ${file}`);
  documents.push({ file, title });
  for (const token of parseMarkdown(source)) for (const child of token.children || []) {
    const href = child.attrGet('src') || child.attrGet('href');
    if (!href || /^(?:https?:|mailto:|#)/i.test(href)) continue;
    const target = decodeURIComponent(href.split(/[?#]/)[0]);
    const resolved = withinDirectory(dir, target);
    assert.ok((await fs.stat(resolved)).isFile(), `Missing reference: ${file}: ${href}`);
    references.push({ file, target });
  }
}
assert.equal(chapterOrder.length, 7);
assert.deepEqual(chapterOrder.slice(-2), ['jht/05-fire-pledge', 'jht/06-worry-seed']);
const allowed = new Set(['release.json', manifest.icon, ...docs, ...references.map(ref => ref.target)]);
const unreferenced = files.filter(file => !allowed.has(file));
assert.deepEqual(unreferenced, [], 'Unexpected or unreferenced files need review');
const receipt = await fingerprint(dir, files);
const published = JSON.parse(await fs.readFile(path.join(root, 'dist/release-integrity.json'), 'utf8')).find(item => item.id === manifest.id);
assert.deepEqual(published.files, receipt.files);
assert.equal(published.digest, receipt.digest);
for (const file of files) assert.deepEqual(await fs.readFile(path.join(root, 'dist/content/cacophony', file)), await fs.readFile(path.join(dir, file)));
// Verify accepted inputs stayed identical to the user's initial committed delivery.
assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'content/cacophony'], { cwd: root, encoding: 'utf8' }), '');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'dist/catalog/projects.json'), 'utf8'));
const book = catalog.find(item => item.id === manifest.id);
for (const id of chapterOrder) {
  assert.ok(book.reader.documents.some(doc => doc.id === id));
  await fs.access(path.join(root, 'dist/file-explorer/a-floppy-disk/cacophony', id, 'index.html'));
}
const contractFiles = await fingerprint(path.join(root, 'contracts/novel-release-v4'), ['README.md', 'release.schema.json']);
const result = {
  project: 'yigrass.github.io', taskId: 'prepublication-artifact-acceptance', date: '2026-11-07',
  decision: 'accepted', scope: 'Local contract and built-site acceptance; remote publication not performed',
  contract: { id: 'novel-release-v4', schemaVersion: manifest.schemaVersion, ...contractFiles },
  artifact: { id: manifest.id, producer: 'cacophony (manifest identity)', producerVersion: 'unknown: not supplied', producerDigest: 'unknown: not supplied', transferComparison: 'not possible without producer receipt', root: 'content/cacophony/', ...receipt },
  schemaCoverage: 'All assertion keywords present in supplied schema, via scoped evaluator; not a general JSON Schema validator',
  documents, chapterOrder, references, unreferenced,
  builtEntries: chapterOrder.map(id => `/file-explorer/a-floppy-disk/cacophony/${id}/`),
  checks: ['four root entries', 'manifest schema assertions', 'safe unique IDs', 'UTF-8 and H1', 'all local Markdown references', 'no extra files', 'exact dist bytes and SHA-256 receipt', 'all chapter entries and reader index', 'received bytes unchanged from HEAD'],
  limitations: ['No independent producer version/digest supplied', 'No literary proofreading or remote deployment verification', 'No licenses/notices required by this contract; no rights audit performed']
};
await fs.writeFile(path.join(qa, 'acceptance.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`Accepted ${files.length} files, ${chapterOrder.length} chapters; SHA-256 ${receipt.digest}`);
