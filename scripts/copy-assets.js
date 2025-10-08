import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const assets = [
  { src: 'manifest.json', dest: 'dist/manifest.json' },
  { src: 'icons', dest: 'dist/icons', isDir: true },
  {
    src: 'src/ui/learning-interface.html',
    dest: 'dist/ui/learning-interface.html',
  },
  {
    src: 'src/ui/learning-interface.css',
    dest: 'dist/ui/learning-interface.css',
  },
  { src: 'src/ui/setup-wizard.html', dest: 'dist/ui/setup-wizard.html' },
  { src: 'src/ui/setup-wizard.css', dest: 'dist/ui/setup-wizard.css' },
  { src: 'src/ui/settings.html', dest: 'dist/ui/settings.html' },
  { src: 'src/ui/settings.css', dest: 'dist/ui/settings.css' },
];

function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyDirectory(src, dest) {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  // For now, just ensure the directory exists
  // Icons will be added manually
  console.log(`Created directory: ${dest}`);
}

assets.forEach(({ src, dest, isDir }) => {
  try {
    if (isDir) {
      copyDirectory(src, dest);
    } else {
      ensureDirectoryExists(dest);
      copyFileSync(src, dest);
      console.log(`Copied: ${src} -> ${dest}`);
    }
  } catch (error) {
    console.error(`Failed to copy ${src}:`, error.message);
  }
});

console.log('Asset copying complete!');
