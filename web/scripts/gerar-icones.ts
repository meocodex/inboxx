import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = join(__dirname, '../public/icons');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

async function gerarIcones() {
  console.log('Gerando ícones do PWA...\n');

  for (const size of sizes) {
    const fontSize = Math.round(size * 0.5);
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#3B82F6"/>
        <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${fontSize}"
              fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">C</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(join(outputDir, `icon-${size}x${size}.png`));

    console.log(`✓ icon-${size}x${size}.png`);
  }

  // Maskable icon (512x512 com padding interno para safe zone)
  const maskableSvg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#3B82F6"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="200"
            fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">C</text>
    </svg>
  `;
  await sharp(Buffer.from(maskableSvg))
    .png()
    .toFile(join(outputDir, 'maskable-icon.png'));
  console.log('✓ maskable-icon.png');

  // Gerar favicon.ico (32x32 PNG - navegadores modernos aceitam PNG)
  const faviconSvg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#3B82F6" rx="4"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="20"
            fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">C</text>
    </svg>
  `;
  await sharp(Buffer.from(faviconSvg))
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));
  console.log('✓ favicon.png');

  // Criar um favicon.ico simples copiando o PNG de 32x32
  // (Para compatibilidade máxima, usaremos o formato PNG que navegadores modernos suportam)
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '../public/favicon.ico'));
  console.log('✓ favicon.ico');

  console.log('\n✅ Todos os ícones gerados com sucesso!');
  console.log(`📁 Diretório: ${outputDir}`);
}

gerarIcones().catch((err) => {
  console.error('Erro ao gerar ícones:', err);
  process.exit(1);
});
