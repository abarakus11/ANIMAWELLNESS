import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir =
  "C:/Users/FIC/.cursor/projects/c-Users-FIC-Desktop-ANIMAWELLNESS/assets";
const outDir = path.join(__dirname, "..", "assets", "partners");

const partners = [
  { out: "iprotector.png", match: "LOGO_IPROTECTOR_ORIGINAL", invert: false, threshold: 36 },
  { out: "rwb.png", match: "RWB_1", invert: true, threshold: 40 },
  { out: "liv-eco-habitats.png", match: "LOGO_LIV_ORIGINAL", invert: false, threshold: 34 },
  { out: "legalcert.png", match: "LEGALCERT_1", invert: true, threshold: 44 },
  { out: "legal-expert.png", match: "LEGAL_EXPERT_1", invert: true, threshold: 44 },
  { out: "fic-capital.png", match: "FIC_1", invert: true, threshold: 40 },
  { out: "ficcionarios.png", match: "LOGO_FICCIONARIOS_PRETO", invert: true, threshold: 40 },
  { out: "metal-invest-pay.png", match: "METAL_1", invert: false, threshold: 50 },
  { out: "sinatra.png", match: "SINATRA_1", invert: true, threshold: 40 },
  { out: "sunrise-advisors.png", match: "SUNRISE_1", invert: false, threshold: 36 },
  { out: "wall-brazil.png", match: "WALL_BRAZIL_1", invert: true, threshold: 40 },
  { out: "deep-play.png", match: "DEEP_1", invert: false, threshold: 40 },
  { out: "fts.png", match: "FTS_1", invert: true, threshold: 40 },
  { out: "golden-valley.png", match: "GOLDEN_VALLEY_1", invert: true, threshold: 40 },
  { out: "cacana.png", match: "_ACANA_1", invert: false, threshold: 36 },
];

function findSource(match) {
  return fs.readdirSync(srcDir).find((f) => f.includes(match));
}

async function knockOut(input, output, { invert, threshold }) {
  let { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (invert) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  }

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

    if (max - min <= 10 && max <= threshold + 20) {
      data[i + 3] = 0;
      continue;
    }

    const edge = Math.min(1, (max - threshold) / 24);
    if (max < threshold + 35) data[i + 3] = Math.round(255 * edge);
  }

  const tmp = path.join(outDir, `.tmp-${output}`);
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize({ height: 160, fit: "inside", withoutEnlargement: false })
    .png()
    .toFile(tmp);

  fs.renameSync(tmp, path.join(outDir, output));
  console.log(`ok: ${output}`);
}

fs.mkdirSync(outDir, { recursive: true });

for (const partner of partners) {
  const sourceName = findSource(partner.match);
  if (!sourceName) {
    console.warn(`missing: ${partner.match}`);
    continue;
  }
  await knockOut(path.join(srcDir, sourceName), partner.out, partner);
}
