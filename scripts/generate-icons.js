import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [16, 32, 48, 128];
const sourceIcon = join(__dirname, '../icons/Vocabeey-4.png');

async function generateIcons() {
  console.log('Generating icons from Vocabeey-4.png...\n');

  for (const size of sizes) {
    const outputPath = join(__dirname, `../icons/icon${size}.png`);

    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated icon${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon${size}.png:`, error.message);
    }
  }

  console.log('\nIcon generation complete!');
}

generateIcons().catch(console.error);
