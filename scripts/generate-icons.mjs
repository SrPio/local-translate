// Rasterizes the extension icon to PNG without external dependencies.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

// Signed distance to a rounded rectangle centered at (cx, cy).
const roundRect = (x, y, cx, cy, hw, hh, r) => {
  const dx = Math.abs(x - cx) - hw + r;
  const dy = Math.abs(y - cy) - hh + r;
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
};
const coverage = (d, aa) => Math.min(Math.max(0.5 - d / aa, 0), 1);

function render(size) {
  const s = size / 128;
  const aa = 1 / s;
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0;
    for (let px = 0; px < size; px++) {
      // Work in a 128-unit design space, sampling pixel centers.
      const x = (px + 0.5) / s;
      const y = (py + 0.5) / s;
      const bg = coverage(roundRect(x, y, 64, 64, 60, 60, 28), aa);
      // Back card (source text) and front card (translation).
      const back = coverage(roundRect(x, y, 50, 50, 26, 22, 8), aa);
      const front = coverage(roundRect(x, y, 78, 78, 26, 22, 8), aa);
      const frontRing = coverage(roundRect(x, y, 78, 78, 31, 27, 12), aa);
      // Text lines on the front card.
      const line1 = coverage(roundRect(x, y, 78, 71, 15, 3.5, 3.5), aa);
      const line2 = coverage(roundRect(x, y, 72, 85, 9, 3.5, 3.5), aa);

      // Gradient indigo -> violet background.
      const t = (x + y) / 256;
      let r = 79 + (124 - 79) * t, g = 70 + (58 - 70) * t, b = 229 + (237 - 229) * t;
      // Back card: translucent white.
      const backA = back * (1 - frontRing) * 0.55;
      r += (255 - r) * backA; g += (255 - g) * backA; b += (255 - b) * backA;
      // Front card: white, with indigo lines.
      const lines = Math.max(line1, line2);
      const fr = 255 + (79 - 255) * lines, fg = 255 + (70 - 255) * lines, fb = 255 + (229 - 255) * lines;
      r += (fr - r) * front; g += (fg - g) * front; b += (fb - b) * front;

      const o = py * (size * 4 + 1) + 1 + px * 4;
      raw[o] = Math.round(r); raw[o + 1] = Math.round(g); raw[o + 2] = Math.round(b);
      raw[o + 3] = Math.round(bg * 255);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(`public/icons/icon-${size}.png`, render(size));
}
