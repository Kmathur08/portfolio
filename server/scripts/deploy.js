// Export admin edits and put them live in one step (run from the server folder):
//   npm run deploy
//   npm run deploy -- "Add new internship"      (optional commit message)
// Exports to site/, commits only site/ and pushes; Vercel then redeploys by itself.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
const message = process.argv.slice(2).join(' ').trim() || 'Update portfolio content';

execFileSync(process.execPath, [path.join(here, 'export.js')], { stdio: 'inherit' });

if (!git('status', '--porcelain', '--', 'site')) {
  console.log('\nNothing changed on the site since the last push, so there is nothing to deploy.');
  process.exit(0);
}
git('add', '--', 'site');
git('commit', '-q', '-m', message, '--', 'site');
if (/claude|co-authored/i.test(git('log', '-1', '--format=%B'))) {
  git('reset', '-q', '--soft', 'HEAD~1');
  console.error('Stopped: the commit message mentions Claude or a co-author. Nothing was pushed.');
  process.exit(1);
}
console.log(`\nCommitted "${message}". Pushing...`);
execFileSync('git', ['push', '-q'], { cwd: repo, stdio: 'inherit' });
console.log('Pushed. The live site updates in about a minute: https://kshitij-mathur.vercel.app/');
