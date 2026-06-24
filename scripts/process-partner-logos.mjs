import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDirs = [
  "C:/Users/FIC/.cursor/projects/c-Users-FIC-Desktop-ANIMAWELLNESS/assets",
  "C:/Users/FIC/Desktop/emilly dashboards/logos",
  "C:/Users/FIC/Desktop/logos grupo fic",
  "C:/Users/FIC/Desktop/logos projeto lilinhazinha",
];
const outDir = path.join(__dirname, "..", "assets", "partners");

const partners = [
  { out: "iprotector.png", match: "LOGO_IPROTECTOR_ORIGINAL", invert: false, threshold: 36 },
  { out: "rwb.png", match: "RWB_1", invert: true, threshold: 40 },
  { out: "liv-eco-habitats.png", match: "LOGO_LIV_ORIGINAL", invert: false, threshold: 34 },
  { out: "legalcert.png", match: "LEGALCERT_1", invert: true, threshold: 44 },
  { out: "legal-expert.png", match: "LEGAL_EXPERT_1", invert: true, threshold: 44 },
  { out: "fic-capital.png", match: "FIC_1", invert: true, threshold: 40 },
  { out: "ficcionarios.png", match: "LOGO_FICCIONARIOS_PRETO", invert: true, threshold: 40 },
  { out: "metal-invest-pay.png", match: "METAL INVEST PAY", invert: true, threshold: 50 },
  { out: "sinatra.png", match: "SINATRA_1", invert: true, threshold: 40 },
  { out: "sunrise-advisors.png", match: "SUNRISE_1", invert: false, threshold: 36 },
  { out: "wall-brazil.png", match: "WALL_BRAZIL_1", invert: true, threshold: 40 },
  { out: "deep-play.png", match: "DEEP 1", mode: "brand-dark", threshold: 40 },
  { out: "fts.png", match: "FTS_1", invert: true, threshold: 40 },
  { out: "golden-valley.png", match: "GOLDEN_VALLEY_1", invert: true, threshold: 40 },
  { out: "cacana.png", match: "_ACANA_1", invert: false, threshold: 36 },
];

function findSource(match) {
  for (const dir of srcDirs) {
    if (!fs.existsSync(dir)) continue;
    const hit = fs.readdirSync(dir).find((f) => f.includes(match));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

async function loadRaster(input, mode) {
  let pipeline = sharp(input, input.toLowerCase().endsWith(".svg") ? { density: 300 } : {});

  if (mode === "brand-dark") {
    pipeline = pipeline.trim({ threshold: 12 });
  }

  return pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function knockOut(input, output, { invert, threshold, mode = "default" }) {
  let { data, info } = await loadRaster(input, mode);

  if (mode === "brand-dark") {
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 16) {
        data[i + 3] = 0;
        continue;
      }

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max - min;

      if (max >= 235 && sat <= 24) {
        data[i + 3] = 0;
        continue;
      }

      if (r > 160 && g < 90 && b < 90) {
        data[i + 3] = 255;
        continue;
      }

      if (max <= 120 && sat <= 36) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
        continue;
      }

      if (max <= 180 && sat <= 24) {
        const lift = Math.round(((180 - max) / 180) * 255);
        data[i] = lift;
        data[i + 1] = lift;
        data[i + 2] = lift;
        data[i + 3] = 255;
        continue;
      }

      data[i + 3] = sat > 24 ? 255 : 0;
    }
  } else {
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
  }

  const tmp = path.join(outDir, `.tmp-${output}`);
  let outPipeline = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  if (mode === "brand-dark") {
    outPipeline = outPipeline.trim({ threshold: 12 });
  }

  await outPipeline
    .resize({ height: 160, fit: "inside", withoutEnlargement: false })
    .png()
    .toFile(tmp);

  fs.renameSync(tmp, path.join(outDir, output));
  console.log(`ok: ${output}`);
}

fs.mkdirSync(outDir, { recursive: true });

for (const partner of partners) {
  const sourcePath = findSource(partner.match);
  if (!sourcePath) {
    console.warn(`missing: ${partner.match}`);
    continue;
  }
  await knockOut(sourcePath, partner.out, partner);
}
