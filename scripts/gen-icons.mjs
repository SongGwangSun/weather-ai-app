/**
 * SVG → PNG 아이콘 생성 (sharp 사용)
 * 실행: node scripts/gen-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath   = path.join(__dirname, '../public/icons/icon.svg');
const outDir    = path.join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);

const targets = [
  { name: 'icon-96.png',           size: 96  },
  { name: 'icon-192.png',          size: 192 },
  { name: 'icon-512.png',          size: 512 },
  { name: 'icon-maskable-512.png', size: 512 },
];

for (const { name, size } of targets) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, name));
  console.log(`✓ ${name} (${size}×${size})`);
}

console.log('\n✅ 아이콘 생성 완료!');
