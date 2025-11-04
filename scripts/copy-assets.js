import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';

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
  {
    src: 'src/ui/onboarding-wizard.css',
    dest: 'dist/ui/onboarding-wizard.css',
  },
  { src: 'src/ui/setup-wizard.html', dest: 'dist/ui/setup-wizard.html' },
  { src: 'src/ui/setup-wizard.css', dest: 'dist/ui/setup-wizard.css' },
  { src: 'src/ui/settings.html', dest: 'dist/ui/settings.html' },
  { src: 'src/ui/settings.css', dest: 'dist/ui/settings.css' },
  {
    src: 'src/offscreen/ai-processor.html',
    dest: 'dist/offscreen/ai-processor.html',
  },
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

  const items = readdirSync(src);
  items.forEach(item => {
    const srcPath = join(src, item);
    const destPath = join(dest, item);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
      console.log(`Copied: ${srcPath} -> ${destPath}`);
    }
  });
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
