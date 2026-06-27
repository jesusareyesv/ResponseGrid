/**
 * Generates minimal valid placeholder PNG icons for the PWA manifest.
 * Produces a solid dark (#111827) square with a white "R".
 * Replace with real artwork before production.
 *
 * Usage: node scripts/gen-icons.mjs
 * Requires only Node.js built-ins — no extra deps needed.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/icons');

// ---------- PNG helpers ----------

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 1);
  // Note: must keep full 32-bit roll
  let crc2 = 0xffffffff;
  for (const b of buf) {
    const idx = (crc2 ^ b) & 0xff;
    crc2 = (CRC_TABLE[idx] ^ (crc2 >>> 8)) >>> 0;
  }
  return (crc2 ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeB = Buffer.from(type, 'ascii');
  const dataB = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crcInput = Buffer.concat([typeB, dataB]);
  return Buffer.concat([u32be(dataB.length), typeB, dataB, u32be(crc32(crcInput))]);
}

function buildPng(size, pixelFn) {
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  // filter, interlace = 0

  // Raw scanlines: filter byte 0 + RGB per row
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelFn(x, y);
      const off = y * rowLen + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  // IDAT: deflate with Node's built-in zlib
  const idat = deflateSync(raw, { level: 6 });

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Icon drawing ----------

/**
 * Dark background (#111827) with a white "R" letterform.
 */
function iconPixel(x, y, size) {
  const BG = /** @type {[number,number,number]} */ ([17, 24, 39]);
  const FG = /** @type {[number,number,number]} */ ([255, 255, 255]);

  const margin = Math.round(size * 0.22);
  const lw = size - margin * 2;
  const lh = Math.round(lw * 1.25);
  const lx = margin;
  const ly = Math.round((size - lh) / 2);

  const nx = x - lx;
  const ny = y - ly;
  if (nx < 0 || nx >= lw || ny < 0 || ny >= lh) return BG;

  const t = Math.max(2, Math.round(lw * 0.13)); // stroke thickness

  // Vertical left stem
  if (nx < t) return FG;

  // Bump (upper half)
  const bumpH = Math.round(lh * 0.5);

  // top horizontal bar
  if (ny < t && nx < Math.round(lw * 0.8)) return FG;

  // middle horizontal bar
  if (ny >= bumpH - t && ny < bumpH && nx < Math.round(lw * 0.8)) return FG;

  // right vertical of bump
  if (nx >= lw - t && ny < bumpH) return FG;

  // Leg: diagonal from (t, bumpH) to (lw-1, lh-1)
  const legStartX = t;
  const legStartY = bumpH;
  const legEndX = lw - 1;
  const legEndY = lh - 1;
  const dxL = legEndX - legStartX;
  const dyL = legEndY - legStartY;
  const lenL = Math.hypot(dxL, dyL);
  const dist = Math.abs((ny - legStartY) * dxL - (nx - legStartX) * dyL) / lenL;
  const proj = ((nx - legStartX) * dxL + (ny - legStartY) * dyL) / (lenL * lenL);
  if (dist <= t * 0.9 && proj >= 0 && proj <= 1) return FG;

  return BG;
}

// ---------- Main ----------

for (const size of [192, 512]) {
  const png = buildPng(size, (x, y) => iconPixel(x, y, size));
  const outPath = resolve(OUT, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`wrote ${outPath} (${png.length} bytes)`);
}
