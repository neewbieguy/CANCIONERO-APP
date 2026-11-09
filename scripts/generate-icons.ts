/**
 * Genera los íconos PNG de la PWA a partir de public/icons/icon.svg
 * Uso: npm run icons
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dir = path.join(process.cwd(), "public", "icons");

async function main() {
  const svg = await readFile(path.join(dir, "icon.svg"));

  for (const size of [192, 512]) {
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(dir, `icon-${size}.png`));
  }

  // Apple: sin transparencia, esquinas las pone iOS
  await sharp(svg, { density: 384 })
    .resize(180, 180)
    .flatten({ background: "#1b6ef3" })
    .png()
    .toFile(path.join(dir, "apple-touch-icon.png"));

  // Maskable: fondo a sangre completa (sin esquinas); la nota ya cae dentro de la zona segura
  const fullBleed = Buffer.from(svg.toString().replace('rx="120"', 'rx="0"'));
  await sharp(fullBleed, { density: 384 }).resize(512, 512).png().toFile(path.join(dir, "maskable-512.png"));

  console.log("Íconos generados en public/icons");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
