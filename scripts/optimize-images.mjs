import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const ASSETS_ROOT = path.resolve(process.cwd(), 'public', 'assets');
const CACHE_ROOT = path.resolve(process.cwd(), 'public', '.webp-cache');
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, list);
    } else if (EXTS.has(path.extname(entry.name).toLowerCase())) {
      list.push(full);
    }
  }
  return list;
}

async function encodeVariant(src, dest, maxDim, quality) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    const srcStat = fs.statSync(src);
    const destStat = fs.statSync(dest);
    if (destStat.mtimeMs >= srcStat.mtimeMs && destStat.size > 0) {
      return 'skipped';
    }
  }
  await execFileAsync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    src,
    '-vf',
    `scale='min(${maxDim},iw)':'min(${maxDim},ih)':force_original_aspect_ratio=decrease`,
    '-c:v',
    'libwebp',
    '-q:v',
    String(quality),
    '-compression_level',
    '4',
    dest,
  ]);
  return 'generated';
}

async function main() {
  const files = walk(ASSETS_ROOT);
  let originalBytes = 0;
  let fullBytes = 0;
  let thumbBytes = 0;
  let generated = 0;
  let failed = 0;

  const CONCURRENCY = 8;
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const i = index++;
      const src = files[i];
      const rel = path.relative(ASSETS_ROOT, src);
      const fullDest = path.join(CACHE_ROOT, `${rel}.full.webp`);
      const thumbDest = path.join(CACHE_ROOT, `${rel}.thumb.webp`);
      try {
        originalBytes += fs.statSync(src).size;
        const r1 = await encodeVariant(src, fullDest, 1000, 82);
        const r2 = await encodeVariant(src, thumbDest, 480, 78);
        if (r1 === 'generated' || r2 === 'generated') generated++;
        if (fs.existsSync(fullDest)) fullBytes += fs.statSync(fullDest).size;
        if (fs.existsSync(thumbDest)) thumbBytes += fs.statSync(thumbDest).size;
      } catch (err) {
        failed++;
        console.error('Failed:', rel, err?.message || err);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  console.log(
    JSON.stringify({
      totalImages: files.length,
      generated,
      failed,
      originalMB: (originalBytes / 1024 / 1024).toFixed(2),
      fullWebpMB: (fullBytes / 1024 / 1024).toFixed(2),
      thumbWebpMB: (thumbBytes / 1024 / 1024).toFixed(2),
    })
  );
}

main();
