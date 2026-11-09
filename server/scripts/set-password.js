// Sets (or changes) the admin password. Usage: npm run set-password
// Non-interactive use: ADMIN_NEW_PASSWORD="..." npm run set-password
import readline from 'node:readline';
import { savePassword } from '../lib/auth.js';

async function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const muted = { on: false };
  rl._writeToOutput = s => { if (!muted.on) rl.output.write(s); };
  return new Promise(res => { rl.question(q, a => { rl.close(); process.stdout.write('\n'); res(a); }); muted.on = true; });
}

let pw = process.env.ADMIN_NEW_PASSWORD;
if (!pw) {
  pw = await ask('New admin password (at least 10 characters): ');
  const again = await ask('Type it again: ');
  if (pw !== again) { console.error('The two passwords did not match. Nothing was changed.'); process.exit(1); }
}
if (!pw || pw.length < 10) { console.error('Use at least 10 characters. Nothing was changed.'); process.exit(1); }
await savePassword(pw);
console.log('Admin password saved to data/auth.json. Sign in at /admin.');
