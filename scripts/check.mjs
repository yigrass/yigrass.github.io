import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build, projectRoot } from './build.mjs';
import { listFiles } from './lib/files.mjs';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Check failed: ${command} ${args.join(' ')}`);
}
for (const directory of ['src', 'scripts', 'tests']) {
  for (const file of await listFiles(path.join(projectRoot, directory))) if (/\.(mjs|js)$/.test(file)) run(process.execPath, ['--check', path.join(directory, file)]);
}
await build();
const testFiles = (await fs.readdir(path.join(projectRoot, 'tests'))).filter(file => file.endsWith('.test.mjs')).map(file => 'tests/' + file);
run(process.execPath, ['--experimental-vm-modules', '--test', '--test-concurrency=1', ...testFiles]);
run('pwsh', ['-NoProfile', '-File', 'scripts/check-task-controls.ps1']);
console.log('Source, release, built-site and task-control checks passed.');
