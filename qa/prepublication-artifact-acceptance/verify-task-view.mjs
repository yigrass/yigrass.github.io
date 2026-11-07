import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const scratch = await fs.mkdtemp(path.join(root, '.test-work/task-view-'));
assert.ok(scratch.startsWith(path.join(root, '.test-work') + path.sep));
try {
  await fs.mkdir(path.join(scratch, 'scripts'));
  await fs.copyFile(path.join(root, 'scripts/generate-task-tree-doc.ps1'), path.join(scratch, 'scripts/generate-task-tree-doc.ps1'));
  const base = { projectName: 'fixture', rootTaskId: 'root', currentContextTaskId: 'leaf', currentWorkingBranchTaskId: 'leaf', activeExecutionBranches: ['leaf'], status: 'in_progress', metadata: { generatedViewPath: 'docs/TASK_TREE.md' }, tasks: [ { id: 'root', name: 'Root', parent: null, status: 'in_progress' }, { id: 'child', name: 'Child', parent: 'root', status: 'in_progress' }, { id: 'leaf', name: 'Leaf', parent: 'child', status: 'in_progress' } ] };
  const write = async data => fs.writeFile(path.join(scratch, 'project-task-tree.json'), JSON.stringify(data));
  const run = (...args) => spawnSync('pwsh', ['-NoProfile', '-File', path.join(scratch, 'scripts/generate-task-tree-doc.ps1'), ...args], { encoding: 'utf8' });
  await write(base); assert.equal(run().status, 0);
  const target = path.join(scratch, 'docs/TASK_TREE.md');
  const text = await fs.readFile(target, 'utf8');
  assert.match(text, /Root \/ Child \/ Leaf/); assert.match(text, /    \\-- Leaf \[in_progress; current; working\]/);
  const before = (await fs.stat(target)).mtimeMs;
  assert.equal(run().status, 0); assert.equal(run('-Check').status, 0); assert.equal((await fs.stat(target)).mtimeMs, before);
  const paused = structuredClone(base); paused.status = 'paused'; paused.currentContextTaskId = 'root'; paused.currentWorkingBranchTaskId = null; paused.activeExecutionBranches = []; paused.tasks.forEach(t => t.status = 'paused');
  await write(paused); assert.equal(run().status, 0); assert.match(await fs.readFile(target, 'utf8'), /Active task: none/);
  for (const mutate of [ t => t.tasks.push(t.tasks[1]), t => t.tasks[1].parent = 'missing', t => t.tasks[1].parent = 'leaf', t => t.currentContextTaskId = 'missing' ]) {
    const invalid = structuredClone(base); mutate(invalid); await write(invalid); assert.notEqual(run().status, 0);
  }
  await write(base); assert.notEqual(run('-Check').status, 0);
  assert.equal(run().status, 0);
  assert.equal(execFileSync('git', ['show', 'HEAD:docs/SOURCE_LAYOUT_PLAN.md'], { cwd: root, encoding: 'utf8' }).replaceAll('\r\n', '\n'), (await fs.readFile(path.join(root, 'qa/prepublication-artifact-acceptance/source-layout-plan.md'), 'utf8')).replaceAll('\r\n', '\n'));
  console.log('PASS: nested tree, markers, deterministic repeat, read-only check, paused state, duplicate/parent/cycle/reference rejection, stale-view detection, archived plan unchanged');
} finally {
  await fs.rm(scratch, { recursive: true });
}
