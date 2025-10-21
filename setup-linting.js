#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Chrome Extension Linting Environment...\n');

const args = process.argv.slice(2);
const useESLint = args.includes('--eslint');
const useOxlint = args.includes('--oxlint') || !useESLint;

console.log(
  `📦 Installing dependencies for ${useOxlint ? 'Oxlint' : 'ESLint'} setup...`
);

try {
  // Ensure all required dependencies are installed
  if (useOxlint) {
    console.log('⚡ Installing Oxlint and dependencies...');
    execSync(
      'pnpm add -D oxlint prettier husky lint-staged @types/chrome chrome-types',
      { stdio: 'inherit' }
    );
  } else {
    console.log('🔧 Installing ESLint and dependencies...');
    execSync(
      'pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import eslint-config-prettier eslint-plugin-prettier prettier husky lint-staged @types/chrome chrome-types',
      { stdio: 'inherit' }
    );
  }

  // Initialize Husky if not already done
  console.log('\n🐕 Setting up Husky...');
  try {
    execSync('pnpm exec husky install', { stdio: 'inherit' });
  } catch {
    console.log('Husky already initialized or failed to initialize');
  }

  // Create or update pre-commit hook
  const huskyDir = '.husky';
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir);
  }

  fs.writeFileSync(
    path.join(huskyDir, 'pre-commit'),
    'pnpm exec lint-staged\n'
  );

  console.log('\n✅ Setup complete!');
  console.log('\n📋 Available commands:');
  console.log('  pnpm run lint              - Run linter (Oxlint by default)');
  console.log('  pnpm run lint:fix          - Run linter with auto-fix');
  console.log('  pnpm run lint:eslint       - Run ESLint specifically');
  console.log('  pnpm run lint:eslint:fix   - Run ESLint with auto-fix');
  console.log('  pnpm run lint:manifest     - Check manifest.json formatting');
  console.log('  pnpm run lint:extension    - Run full extension linting');
  console.log('  pnpm run validate:extension - Run linting, tests, and build');
  console.log('  pnpm run lint:switch --oxlint  - Switch to Oxlint');
  console.log('  pnpm run lint:switch --eslint - Switch to ESLint');

  console.log('\n🎯 Running initial lint check...');
  execSync('pnpm run lint', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
