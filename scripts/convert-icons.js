/**
 * Icon Conversion Script
 * Converts bee only-2.png to all required sizes for Chrome Extension
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const sourceIcon = path.join(__dirname, '../icons/bee only-2.png');
const iconsDir = path.join(__dirname, '../icons');

async function convertIcons() {
  console.log('Starting icon conversion...');

  // Check if source file exists
  if (!fs.existsSync(sourceIcon)) {
    console.error('Error: bee only-2.png not found in icons directory');
    process.exit(1);
  }

  try {
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon${size}.png`);

      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Created icon${size}.png (${size}x${size})`);
    }

    console.log('\n✓ All icons converted successfully!');
  } catch (error) {
    console.error('Error converting icons:', error);
    process.exit(1);
  }
}

convertIcons();
