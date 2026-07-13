import sharp from 'sharp';

// Overlays a repeating, diagonal, semi-transparent text watermark across
// an image - the standard way to make a preview useless for a client to
// just screenshot and run with, while still being fully visible for
// review purposes. This is a deterrent, not a lock: nothing on the web
// can make a screenshot truly impossible (see the honesty note in
// src/components/ProofViewer.js about this).
export async function watermarkImage(buffer, text) {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1600;
  const height = metadata.height || 2000;

  const safeText = String(text || 'PROOF').slice(0, 60).replace(/[<>&]/g, '');
  const tileSize = 340;
  const cols = Math.ceil(width / tileSize) + 1;
  const rows = Math.ceil(height / tileSize) + 1;

  let tiles = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileSize;
      const y = r * tileSize;
      tiles += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" font-family="monospace" font-size="22" fill="white" fill-opacity="0.22">${safeText}</text>`;
    }
  }

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${tiles}</svg>`;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .webp({ quality: 85 })
    .toBuffer();
}
