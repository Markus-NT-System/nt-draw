// Förbereder bygget: kopierar PDF-biblioteken till app/vendor och ritar programikonen.
// Körs automatiskt av GitHub Actions (och av "npm start" / "npm run dist" lokalt).
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.join(__dirname, '..');

if (!fs.existsSync(path.join(root, 'app', 'index.html'))) throw new Error('app/index.html saknas – ladda upp verktyget först.');

const vendor = path.join(root, 'app', 'vendor');
fs.mkdirSync(vendor, { recursive: true });
for (const [pkg, file] of [['jspdf', 'jspdf.umd.min.js'], ['svg2pdf.js', 'svg2pdf.umd.min.js']]) {
  fs.copyFileSync(path.join(root, 'node_modules', pkg, 'dist', file), path.join(vendor, file));
}

// Ikon 512x512: blå rundad ruta med en spontad bräda i genomskärning.
const S = 512, px = Buffer.alloc(S * S * 4);
const panel = [[96,212],[380,212],[380,250],[416,250],[416,300],[380,300],[380,338],[96,338],[96,300],[132,300],[132,250],[96,250]];
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const inRound = (x, y) => { const r = 96, a = 16, b = S - 16; if (x < a || x > b || y < a || y > b) return false; const cx = Math.min(Math.max(x, a + r), b - r), cy = Math.min(Math.max(y, a + r), b - r); return (x - cx) ** 2 + (y - cy) ** 2 <= r * r; };
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  const i = (y * S + x) * 4; let c = [0, 0, 0, 0];
  if (inRound(x + .5, y + .5)) c = [22, 96, 192, 255];
  if (inPoly(x + .5, y + .5, panel)) c = [239, 227, 207, 255];
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = c[3];
}
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) { raw[y * (S * 4 + 1)] = 0; px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4); }
const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
const crc = b => { let c = 0xFFFFFFFF; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6;
fs.mkdirSync(path.join(root, 'build'), { recursive: true });
fs.writeFileSync(path.join(root, 'build', 'icon.png'), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('Förberett: PDF-bibliotek och ikon.');
