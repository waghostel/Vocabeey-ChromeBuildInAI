#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const useESLint = args.includes('--eslint');
const _useOxlint = args.includes('--oxlint') || !useESLint; // Default to oxlint

const packageJsonPath = path.join(path.dirname(__dirname), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (useESLint) {
  console.log('🔧 Switching to ESLint configuration...');

  // Update package.json scripts to use ESLint
  packageJson.scripts.lint = 'eslint src --ext .ts,.js';
  packageJson.scripts['lint:fix'] = 'eslint src --ext .ts,.js --fix';
  packageJson.scripts['lint:extension'] =
    'eslint src --ext .ts,.js && pnpm run lint:manifest';

  // Update lint-staged to use ESLint
  packageJson['lint-staged']['*.{ts,js}'] = [
    'prettier --write',
    'eslint --fix',
  ];

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  );
  console.log('✅ Switched to ESLint. Run `pnpm run lint` to use ESLint.');
} else {
  console.log('⚡ Switching to Oxlint configuration...');

  // Update package.json scripts to use Oxlint
  packageJson.scripts.lint = 'oxlint src';
  packageJson.scripts['lint:fix'] = 'oxlint src --fix';
  packageJson.scripts['lint:extension'] =
    'oxlint src && pnpm run lint:manifest';

  // Update lint-staged to use Oxlint
  packageJson['lint-staged']['*.{ts,js}'] = [
    'prettier --write',
    'oxlint --fix',
  ];

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  );
  console.log('✅ Switched to Oxlint. Run `pnpm run lint` to use Oxlint.');
}

// Run the linter after switching
try {
  console.log(`\n🚀 Running ${useESLint ? 'ESLint' : 'Oxlint'}...`);
  execSync('pnpm run lint', { stdio: 'inherit' });
} catch {
  console.error(`❌ Linting failed with ${useESLint ? 'ESLint' : 'Oxlint'}`);
  process.exit(1);
}
