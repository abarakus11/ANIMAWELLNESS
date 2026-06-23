import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const partnersDir = path.join(__dirname, "..", "assets", "partners");

async function knockOutBackground(file, threshold = 32) {
  const input = path.join(partnersDir, file);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    if (max <= threshold) {
      data[i + 3] = 0;
      continue;
    }

    if (max - min <= 8 && max <= threshold + 18) {
      data[i + 3] = 0;
      continue;
    }

    const edge = Math.min(1, (max - threshold) / 20);
    data[i + 3] = Math.round(255 * edge);
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(input);

  console.log(`transparent: ${file}`);
}

const files = [
  ["iprotector.png", 34],
  ["rwb.png", 38],
  ["liv-eco-habitats.png", 34],
  ["legalcert.png", 44],
  ["fic-capital.png", 12],
];

for (const [file, threshold] of files) {
  await knockOutBackground(file, threshold);
}
