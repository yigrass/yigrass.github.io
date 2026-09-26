import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Preserve this turn's watcher output separately and undo only its automatic
// append to the completed task's log. No Git state is written.
const previousLog = 'qa/demo-content-removal/preview.stdout.log';
const original = execFileSync('git', ['show', `HEAD:${previousLog}`]);
const current = await fs.readFile(previousLog);
if (!current.subarray(0, original.length).equals(original)) throw new Error('Previous log has unrelated edits');
await fs.writeFile('qa/theme-and-icon-refinement/previous-preview-append.log', current.subarray(original.length));
await fs.writeFile(previousLog, original);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cursors = [];
for (const file of ['assets/pixel-ui/cursor.png', 'assets/pixel-ui/cursor-2x.png']) {
  const bytes = await fs.readFile(file);
  const previous = execFileSync('git', ['show', `HEAD:${file}`]);
  cursors.push({ file, sha256: hash(bytes), previousSha256: hash(previous), unchanged: bytes.equals(previous) });
}
await fs.writeFile('qa/theme-and-icon-refinement/cursor-comparison.json', JSON.stringify(cursors, null, 2) + '\n');
console.log(cursors);
