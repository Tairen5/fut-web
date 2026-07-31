import { readdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';

const PUBLIC_DIR = join(process.cwd(), '..', 'frontend', 'public');
const FOLDERS = ['player-cards', 'clubs', 'nations', 'leagues', 'playstyles', 'packs'];
const ALLOWED = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];

const manifest = {};

for (const folder of FOLDERS) {
  try {
    const dir = join(PUBLIC_DIR, folder);
    const files = readdirSync(dir).filter((f) => ALLOWED.includes(extname(f).toLowerCase()));
    manifest[folder] = files;
  } catch {
    manifest[folder] = [];
  }
}

const out = join(PUBLIC_DIR, 'image-manifest.json');
writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log('Manifest created:', out);
for (const [k, v] of Object.entries(manifest)) {
  console.log(`  ${k}: ${v.length} images`);
}
