#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.turbo',
  '.next',
  'build',
  '.cache',
  'debug',
]);

function scan(dir, prefix = '', depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return '';

  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(item => !item.name.startsWith('.') && !IGNORE.has(item.name))
    .sort((a, b) => {
      if (a.isDirectory() === b.isDirectory())
        return a.name.localeCompare(b.name);
      return a.isDirectory() ? -1 : 1;
    });

  let output = '';
  items.forEach((item, i) => {
    const isLast = i === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const extension = isLast ? '    ' : '│   ';

    output += `${prefix}${connector}${item.name}\n`;

    if (item.isDirectory()) {
      output += scan(
        path.join(dir, item.name),
        prefix + extension,
        depth + 1,
        maxDepth
      );
    }
  });

  return output;
}

const root = process.argv[2] || process.cwd();
const maxDepth = parseInt(process.argv[3]) || 4;

console.log(path.basename(root) + '/');
console.log(scan(root, '', 0, maxDepth));
