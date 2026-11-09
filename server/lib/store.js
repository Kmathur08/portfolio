// Content storage: one JSON document on disk, written atomically, with automatic backups.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(here, '..', 'data'));
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const DEFAULT_FILE = path.join(here, '..', 'content.default.json');
const KEEP_BACKUPS = 30;

export async function init() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  try { await fs.access(CONTENT_FILE); }
  catch { await fs.copyFile(DEFAULT_FILE, CONTENT_FILE); console.log('Created data/content.json from content.default.json'); }
}

export async function readContent() {
  return JSON.parse(await fs.readFile(CONTENT_FILE, 'utf8'));
}

async function writeAtomic(file, text) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

// Saves run one after another, so each backup really is the version just before that save.
let queue = Promise.resolve();
export function writeContent(doc, note = 'save') {
  const run = queue.then(async () => {
    try { await fs.copyFile(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp()}-${note}.json`)); } catch {}
    await writeAtomic(CONTENT_FILE, JSON.stringify(doc, null, 2));
    await pruneBackups();
  });
  queue = run.catch(() => {});
  return run;
}

// Read-modify-write under the same queue (used by the resume upload).
export function updateContent(fn, note) {
  const run = queue.then(async () => {
    const doc = await readContent();
    await fn(doc);
    try { await fs.copyFile(CONTENT_FILE, path.join(BACKUP_DIR, `content-${stamp()}-${note}.json`)); } catch {}
    await writeAtomic(CONTENT_FILE, JSON.stringify(doc, null, 2));
    await pruneBackups();
    return doc;
  });
  queue = run.catch(() => {});
  return run;
}

async function pruneBackups() {
  const files = (await fs.readdir(BACKUP_DIR)).filter(f => f.endsWith('.json')).sort();
  for (const f of files.slice(0, Math.max(0, files.length - KEEP_BACKUPS))) await fs.unlink(path.join(BACKUP_DIR, f)).catch(() => {});
}

export async function listBackups() {
  const files = (await fs.readdir(BACKUP_DIR)).filter(f => f.endsWith('.json')).sort().reverse();
  return Promise.all(files.map(async name => ({ name, size: (await fs.stat(path.join(BACKUP_DIR, name))).size })));
}

export async function restoreBackup(name) {
  if (!/^content-[\w-]+\.json$/.test(name)) throw Object.assign(new Error('Unknown backup'), { status: 400 });
  const doc = JSON.parse(await fs.readFile(path.join(BACKUP_DIR, name), 'utf8'));
  await writeContent(doc, 'before-restore');
  return doc;
}
